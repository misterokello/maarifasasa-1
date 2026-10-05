import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

function getToken(): string | null {
  const raw = Deno.env.get('THINKIFIC_API_ACCESS_TOKEN') ?? Deno.env.get('Thinkific');
  const t = raw?.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
  return t || null;
}

async function verifyAdmin(req: Request) {
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
        status: auth.status!, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = getToken();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Thinkific token not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const fromStr = url.searchParams.get('from'); // ISO date
    const toStr = url.searchParams.get('to');     // ISO date
    const from = fromStr ? new Date(fromStr) : null;
    const to = toStr ? new Date(toStr) : null;

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Page 1 to get total_items
    const limit = 100;
    const firstUrl = new URL(`${THINKIFIC_API_BASE}/users`);
    firstUrl.searchParams.set('page', '1');
    firstUrl.searchParams.set('limit', String(limit));
    firstUrl.searchParams.set('order_by', 'created_at');
    firstUrl.searchParams.set('direction', 'desc');
    const firstRes = await fetch(firstUrl.toString(), { headers });
    if (!firstRes.ok) {
      const txt = await firstRes.text();
      return new Response(JSON.stringify({ error: `Thinkific ${firstRes.status}`, details: txt.slice(0, 500) }), {
        status: firstRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const firstData = await firstRes.json();
    const totalItems = firstData?.meta?.pagination?.total_items ?? (firstData?.items?.length ?? 0);
    const totalPages = firstData?.meta?.pagination?.total_pages ?? 1;

    let inRange = 0;
    let scanned = 0;
    // Daily bucket map: yyyy-mm-dd -> count
    const series: Record<string, number> = {};
    const startDay = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : null;
    const endDay = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate()) : new Date();
    if (startDay) {
      for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        series[key] = 0;
      }
    }
    const countInRange = (items: any[]) => {
      let stopEarly = false;
      for (const u of items) {
        scanned++;
        if (!u.created_at) continue;
        const d = new Date(u.created_at);
        if (from && d < from) {
          // Since sorted desc, once we pass below `from`, we can stop scanning.
          stopEarly = true;
          continue;
        }
        if (to && d > to) continue;
        inRange++;
        const key = d.toISOString().slice(0, 10);
        if (key in series) series[key]++;
        else series[key] = 1;
      }
      return stopEarly;
    };

    let stop = countInRange(firstData?.items || []);
    const maxPages = 50; // safety cap (5000 users)
    let page = 2;
    while (!stop && page <= totalPages && page <= maxPages) {
      const u2 = new URL(`${THINKIFIC_API_BASE}/users`);
      u2.searchParams.set('page', String(page));
      u2.searchParams.set('limit', String(limit));
      u2.searchParams.set('order_by', 'created_at');
      u2.searchParams.set('direction', 'desc');
      const r = await fetch(u2.toString(), { headers });
      if (!r.ok) break;
      const d = await r.json();
      stop = countInRange(d?.items || []);
      page++;
    }

    return new Response(JSON.stringify({
      total_users: totalItems,
      in_range: inRange,
      scanned,
      pages_scanned: Math.min(page - 1, totalPages),
      capped: page > maxPages && !stop,
      from: fromStr,
      to: toStr,
      series: Object.entries(series)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('thinkific-users-stats error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});