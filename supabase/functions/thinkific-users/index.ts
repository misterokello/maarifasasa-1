import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

// In-memory cache for full-dataset fetches (`?all=true`). Lives for the
// lifetime of the edge function isolate. Implements stale-while-revalidate:
//   - within FRESH_TTL: serve cached, no refetch
//   - within STALE_TTL: serve cached immediately AND kick off a background
//     refresh so the next request gets fresh data
//   - past STALE_TTL or no cache: fetch synchronously
const FRESH_TTL_MS = 5 * 60 * 1000;   // 5 minutes — considered fresh
const STALE_TTL_MS = 60 * 60 * 1000;  // 1 hour   — still served while revalidating
const allCache = new Map<string, { storedAt: number; payload: any }>();
const inflight = new Map<string, Promise<void>>();

function cacheKey(query: string) {
  return `q:${query}`;
}

// Background revalidation; deduped per cache key so a stampede of requests
// triggers at most one upstream refresh.
function revalidateAll(key: string, query: string, headers: Record<string, string>) {
  if (inflight.has(key)) return inflight.get(key)!;
  const job = (async () => {
    try {
      const fresh = await fetchAllFromThinkific(query, headers);
      if (fresh.ok) {
        allCache.set(key, { storedAt: Date.now(), payload: fresh.payload });
        console.log(JSON.stringify({
          event: 'thinkific_users_all_revalidated',
          query, items: fresh.payload.items.length, latency: fresh.latency,
        }));
      } else {
        console.error(JSON.stringify({
          event: 'thinkific_users_all_revalidate_error',
          query, status: fresh.status, details: fresh.details,
        }));
      }
    } catch (e) {
      console.error('revalidateAll failed', e);
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, job);
  return job;
}

async function fetchAllFromThinkific(
  query: string,
  headers: Record<string, string>,
): Promise<
  | { ok: true; payload: any; latency: number }
  | { ok: false; status: number; details: string }
> {
  const apiLimit = 250;
  const maxPages = 200;
  const collected: any[] = [];
  let p = 1;
  let lastPagination: any = {};
  const start = Date.now();
  while (p <= maxPages) {
    const tUrl = new URL(`${THINKIFIC_API_BASE}/users`);
    tUrl.searchParams.set('page', String(p));
    tUrl.searchParams.set('limit', String(apiLimit));
    if (query) tUrl.searchParams.set('query[email]', query);
    const res = await fetch(tUrl.toString(), { headers });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, status: res.status, details: txt.slice(0, 500) };
    }
    const data = await res.json();
    const items = data?.items ?? [];
    collected.push(...items);
    lastPagination = data?.meta?.pagination ?? {};
    const totalPagesResp = lastPagination?.total_pages ?? 1;
    if (p >= totalPagesResp || items.length < apiLimit) break;
    p++;
  }
  const latency = Date.now() - start;
  const payload = {
    items: collected,
    meta: {
      pagination: {
        total_items: lastPagination?.total_items ?? collected.length,
        total_pages: 1,
        current_page: 1,
      },
    },
    fresh_ttl_seconds: Math.floor(FRESH_TTL_MS / 1000),
    stale_ttl_seconds: Math.floor(STALE_TTL_MS / 1000),
  };
  return { ok: true, payload, latency };
}

function getToken(): string | null {
  const raw = Deno.env.get('THINKIFIC_API_ACCESS_TOKEN') ?? Deno.env.get('Thinkific');
  const t = raw?.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
  return t || null;
}

async function verifyAdmin(req: Request): Promise<{ ok: boolean; status?: number; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Unauthorized' };
  const token = authHeader.replace('Bearer ', '').trim();

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return { ok: false, status: 401, error: 'Invalid token' };
  }
  const userId = claimsData.claims.sub as string;

  // Verify admin role with service role (bypasses RLS, avoids signing-key edge cases)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const [{ data: adminRow }, { data: roleRow }] = await Promise.all([
    admin.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
    admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
  ]);
  if (!adminRow && !roleRow) return { ok: false, status: 403, error: 'Admin access required' };
  return { ok: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = getToken();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Thinkific token not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';
    const query = url.searchParams.get('query') || '';
    const orderBy = url.searchParams.get('order_by') || 'created_at';
    const direction = url.searchParams.get('direction') || 'desc';
    const all = url.searchParams.get('all') === 'true';
    const refresh = url.searchParams.get('refresh') === 'true';

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // ----- Full-dataset path with server-side caching -----
    if (all) {
      const key = cacheKey(query);
      const now = Date.now();
      const cached = allCache.get(key);

      // Hard refresh: bypass cache entirely and overwrite it
      if (refresh) {
        const fresh = await fetchAllFromThinkific(query, headers);
        if (!fresh.ok) {
          return new Response(JSON.stringify({
            error: `Thinkific API returned HTTP ${fresh.status}`,
            thinkificStatus: fresh.status,
            details: fresh.details,
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        allCache.set(key, { storedAt: now, payload: fresh.payload });
        return new Response(JSON.stringify({
          ...fresh.payload, cached: false, stale: false, cached_at: new Date(now).toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Cached fresh -> return as-is
      if (cached && now - cached.storedAt < FRESH_TTL_MS) {
        console.log(JSON.stringify({
          event: 'thinkific_users_all_cache_hit', query,
          items: cached.payload?.items?.length ?? 0,
          age_ms: now - cached.storedAt,
        }));
        return new Response(JSON.stringify({
          ...cached.payload, cached: true, stale: false,
          cached_at: new Date(cached.storedAt).toISOString(),
          age_seconds: Math.floor((now - cached.storedAt) / 1000),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Cached but stale -> serve stale, revalidate in background
      if (cached && now - cached.storedAt < STALE_TTL_MS) {
        const job = revalidateAll(key, query, headers);
        // @ts-ignore EdgeRuntime is provided by Supabase Edge Functions runtime
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(job);
        }
        console.log(JSON.stringify({
          event: 'thinkific_users_all_stale_hit', query,
          items: cached.payload?.items?.length ?? 0,
          age_ms: now - cached.storedAt,
        }));
        return new Response(JSON.stringify({
          ...cached.payload, cached: true, stale: true, revalidating: true,
          cached_at: new Date(cached.storedAt).toISOString(),
          age_seconds: Math.floor((now - cached.storedAt) / 1000),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // No usable cache -> fetch synchronously
      const fresh = await fetchAllFromThinkific(query, headers);
      if (!fresh.ok) {
        return new Response(JSON.stringify({
          error: `Thinkific API returned HTTP ${fresh.status}`,
          thinkificStatus: fresh.status,
          details: fresh.details,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      allCache.set(key, { storedAt: now, payload: fresh.payload });
      console.log(JSON.stringify({
        event: 'thinkific_users_all_fetch', query,
        items: fresh.payload.items.length, latency: fresh.latency,
      }));
      return new Response(JSON.stringify({
        ...fresh.payload, cached: false, stale: false, cached_at: new Date(now).toISOString(),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tUrl = new URL(`${THINKIFIC_API_BASE}/users`);
    tUrl.searchParams.set('page', page);
    tUrl.searchParams.set('limit', limit);
    if (query) {
      // Try email contains
      tUrl.searchParams.set('query[email]', query);
    }
    tUrl.searchParams.set('order_by', orderBy);
    tUrl.searchParams.set('direction', direction);

    const start = Date.now();
    const res = await fetch(tUrl.toString(), { headers });
    const latency = Date.now() - start;
    console.log(JSON.stringify({ event: 'thinkific_users_list', status: res.status, latency, page, query }));

    if (!res.ok) {
      const txt = await res.text();
      console.error(JSON.stringify({ event: 'thinkific_users_error', status: res.status, body: txt.slice(0, 1000) }));
      // Return 200 so the frontend can surface the upstream error message
      // instead of crashing with a generic "non-2xx" message.
      return new Response(JSON.stringify({
        error: `Thinkific API returned HTTP ${res.status}`,
        thinkificStatus: res.status,
        details: txt.slice(0, 500),
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('thinkific-users error', e);
    return new Response(JSON.stringify({
      error: (e as Error).message,
      thinkificStatus: null,
      details: null,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});