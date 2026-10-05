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
    const userId = url.searchParams.get('user_id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Fetch user + enrollments in parallel
    const enrollUrl = new URL(`${THINKIFIC_API_BASE}/enrollments`);
    enrollUrl.searchParams.set('query[user_id]', userId);
    enrollUrl.searchParams.set('limit', '100');

    const [userRes, enrollRes] = await Promise.all([
      fetch(`${THINKIFIC_API_BASE}/users/${userId}`, { headers }),
      fetch(enrollUrl.toString(), { headers }),
    ]);

    if (!userRes.ok) {
      const txt = await userRes.text();
      await enrollRes.text();
      return new Response(JSON.stringify({ error: `User fetch ${userRes.status}`, details: txt.slice(0, 300) }), {
        status: userRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = await userRes.json();
    let enrollments: any[] = [];
    if (enrollRes.ok) {
      const ed = await enrollRes.json();
      enrollments = ed.items || [];
    } else {
      await enrollRes.text();
    }

    // Try express sign-in URL (best-effort)
    let signInUrl: string | null = null;
    try {
      const sRes = await fetch(`${THINKIFIC_API_BASE}/users/${userId}/sign_in_url`, { headers });
      if (sRes.ok) {
        const sd = await sRes.json();
        signInUrl = sd.express_sign_in_url || sd.sign_in_url || null;
      } else {
        await sRes.text();
      }
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ user, enrollments, sign_in_url: signInUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('thinkific-user-detail error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});