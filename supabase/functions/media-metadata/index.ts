import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/** Only signed-in admins may make the server fetch a remote page. */
async function isAdmin(req: Request): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  return data === true;
}

/** Blocks private, loopback, link-local and metadata addresses (SSRF guard). */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return true;
  // IPv6 checks only apply to IPv6 literals (they contain a colon), never DNS names.
  if (host.includes(':')) {
    if (host === '::1' || host === '::') return true;
    if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true; // unique local
    if (/^fe[89ab][0-9a-f]?:/.test(host)) return true; // link-local
    if (/^::ffff:/.test(host)) {
      const mapped = host.replace(/^::ffff:/, '');
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(mapped)) return isBlockedHost(mapped);
    }
    return false;
  }
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }
  return false;
}

async function resolvesToBlockedIp(hostname: string): Promise<boolean> {
  try {
    const records = await Promise.allSettled([
      Deno.resolveDns(hostname, 'A'),
      Deno.resolveDns(hostname, 'AAAA'),
    ]);
    const ips = records.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    return ips.some((ip) => isBlockedHost(ip));
  } catch {
    return false;
  }
}

/** Extracts the first matching attribute value from a meta tag. */
function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${key}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeEntities(m[1].trim());
    }
  }
  return null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function absolute(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

/** Finds an icon/logo declared with <link rel="...icon"> tags. */
function linkIcon(html: string, base: string): string | null {
  const matches = html.matchAll(/<link[^>]+>/gi);
  const candidates: { href: string; score: number }[] = [];
  for (const tag of matches) {
    const raw = tag[0];
    const rel = raw.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
    const href = raw.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (rel.includes('apple-touch-icon')) candidates.push({ href, score: 3 });
    else if (rel.includes('icon')) candidates.push({ href, score: rel.includes('shortcut') ? 1 : 2 });
  }
  candidates.sort((a, b) => b.score - a.score);
  return absolute(candidates[0]?.href ?? null, base);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!(await isAdmin(req))) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: 'A valid http(s) article URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isBlockedHost(new URL(url).hostname) || (await resolvesToBlockedIp(new URL(url).hostname))) {
      return new Response(JSON.stringify({ error: 'That address is not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Follow redirects manually so each hop is re-checked against the blocklist.
    let target = new URL(url);
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(target.toString(), {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MaarifasasaBot/1.0; +https://maarifasasa.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (!location) break;
      const next = new URL(location, target);
      if (!/^https?:$/i.test(next.protocol) || isBlockedHost(next.hostname) || (await resolvesToBlockedIp(next.hostname))) {
        return new Response(JSON.stringify({ error: 'That address is not allowed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      target = next;
    }
    if (!res) throw new Error('No response from article URL');

    if (!res.ok) {
      const body = await res.text();
      console.error(`Article fetch failed [${res.status}]: ${body.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: 'Could not fetch that article', status: res.status }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const html = (await res.text()).slice(0, 400_000);
    const finalUrl = target.toString();
    const host = new URL(finalUrl).hostname.replace(/^www\./, '');

    const title =
      meta(html, ['og:title', 'twitter:title']) ??
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
        ? decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)![1].trim())
        : null);

    const image = absolute(
      meta(html, ['og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image', 'twitter:image:src']),
      finalUrl,
    );

    const outletName = meta(html, ['og:site_name', 'application-name', 'publisher']) ?? host;
    const logo =
      absolute(meta(html, ['og:logo', 'msapplication-TileImage']), finalUrl) ??
      linkIcon(html, finalUrl) ??
      `https://www.google.com/s2/favicons?domain=${host}&sz=128`;

    const excerpt = meta(html, ['og:description', 'twitter:description', 'description']);
    const published = meta(html, [
      'article:published_time',
      'og:article:published_time',
      'datePublished',
      'publish-date',
      'date',
    ]);
    const publishedAt = published && !Number.isNaN(Date.parse(published))
      ? new Date(published).toISOString().slice(0, 10)
      : null;

    return new Response(
      JSON.stringify({
        article_url: finalUrl,
        title,
        outlet_name: outletName,
        outlet_logo_url: logo,
        image_url: image,
        excerpt: excerpt ? excerpt.slice(0, 400) : null,
        published_at: publishedAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('media-metadata error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
