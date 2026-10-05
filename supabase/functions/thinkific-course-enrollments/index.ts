import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  if (!authHeader) return { ok: false, status: 401, error: 'Unauthorized' };
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return { ok: false, status: 401, error: 'Invalid token' };
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return { ok: false, status: 403, error: 'Admin access required' };
  return { ok: true };
}

// Simple per-isolate cache (5 min fresh)
const FRESH_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { storedAt: number; payload: any }>();

function normalizeThinkificPercent(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
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
    let courseId = url.searchParams.get('course_id');
    // Support POST invocations from the admin UI (Supabase functions.invoke sends body)
    if (!courseId && req.method !== 'GET') {
      try {
        const body = await req.json();
        courseId = body?.course_id ?? null;
      } catch { /* ignore non-JSON body */ }
    }
    if (!courseId) {
      return new Response(JSON.stringify({ error: 'course_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey = `course:${courseId}`;
    const cached = cache.get(cacheKey);
    const bypassCache = url.searchParams.has('_') || url.searchParams.get('refresh') === 'true';
    if (!bypassCache && cached && Date.now() - cached.storedAt < FRESH_TTL_MS) {
      return new Response(JSON.stringify({ ...cached.payload, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Paginate enrollments for course
    const all: any[] = [];
    let page = 1;
    const limit = 250;
    while (true) {
      const u = new URL(`${THINKIFIC_API_BASE}/enrollments`);
      u.searchParams.set('query[course_id]', courseId);
      u.searchParams.set('page', String(page));
      u.searchParams.set('limit', String(limit));
      const res = await fetch(u.toString(), { headers });
      if (!res.ok) {
        const txt = await res.text();
        return new Response(JSON.stringify({ error: `Enrollments fetch ${res.status}`, details: txt.slice(0, 300) }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const data = await res.json();
      const items = (data.items || []).map((e: any) => ({
        ...e,
        percentage_completed: normalizeThinkificPercent(e.percentage_completed),
      }));
      all.push(...items);
      const meta = data.meta?.pagination;
      const totalPages = meta?.total_pages || 1;
      if (page >= totalPages || items.length === 0) break;
      page++;
      if (page > 50) break; // safety
    }

    // Compute analytics
    const total = all.length;
    const completed = all.filter((e) => e.completed).length;
    const inProgress = all.filter((e) => !e.completed && Number(e.percentage_completed || 0) > 0).length;
    const notStarted = all.filter((e) => Number(e.percentage_completed || 0) === 0 && !e.completed).length;
    const expired = all.filter((e) => e.expired).length;
    const freeTrial = all.filter((e) => e.is_free_trial).length;
    const avgProgress = total
      ? Math.round(all.reduce((a, e) => a + Number(e.percentage_completed || 0), 0) / total)
      : 0;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    // Time-based: last 30 days
    const now = Date.now();
    const day30 = now - 30 * 24 * 60 * 60 * 1000;
    const newLast30 = all.filter((e) => {
      const t = e.activated_at || e.created_at || e.started_at;
      return t && new Date(t).getTime() >= day30;
    }).length;
    const completedLast30 = all.filter((e) => {
      return e.completed_at && new Date(e.completed_at).getTime() >= day30;
    }).length;

    const payload = {
      enrollments: all,
      analytics: {
        total, completed, inProgress, notStarted, expired, freeTrial,
        avgProgress, completionRate, newLast30, completedLast30,
      },
    };
    cache.set(cacheKey, { storedAt: Date.now(), payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('thinkific-course-enrollments error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});