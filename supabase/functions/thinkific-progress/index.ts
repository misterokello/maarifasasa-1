import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

function getThinkificAccessToken(): string | null {
  const rawToken = Deno.env.get('THINKIFIC_API_ACCESS_TOKEN') ?? Deno.env.get('Thinkific');
  const token = rawToken?.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
  return token || null;
}

function getThinkificHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

interface ProgressRequest {
  enrollment_ids: number[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = getThinkificAccessToken();
    
    if (!apiKey) {
      console.error("Thinkific API Access Token not found in environment");
      return new Response(
        JSON.stringify({ error: "Thinkific API Access Token not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ProgressRequest = await req.json();
    const requestedIds = body?.enrollment_ids;

    if (!requestedIds || !Array.isArray(requestedIds) || requestedIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "enrollment_ids array is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require a signed-in caller, then restrict the enrollment IDs to the ones
    // they own (admins and learner admins may read any enrollment).
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isStaff = false;
    for (const role of ['admin', 'learner_admin']) {
      const { data } = await userClient.rpc('has_role', { _user_id: user.id, _role: role });
      if (data === true) { isStaff = true; break; }
    }

    const numericIds = requestedIds.map(Number).filter((n) => Number.isFinite(n));
    const adminDb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    let ownedQuery = adminDb
      .from('enrollments')
      .select('thinkific_enrollment_id')
      .in('thinkific_enrollment_id', numericIds);
    if (!isStaff) ownedQuery = ownedQuery.eq('user_id', user.id);
    const { data: ownedRows } = await ownedQuery;
    const enrollment_ids = (ownedRows || [])
      .map((r: { thinkific_enrollment_id: number | null }) => Number(r.thinkific_enrollment_id))
      .filter((n) => Number.isFinite(n));

    if (enrollment_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, progress: {}, completions: {}, persisted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = getThinkificHeaders(apiKey);

    // Fetch progress for each enrollment
    const progressResults: Record<number, number> = {};
    const completionInfo: Record<number, { percent: number; completed: boolean; completed_at: string | null }> = {};

    await Promise.all(
      enrollment_ids.map(async (enrollmentId) => {
        try {
          const response = await fetch(
            `${THINKIFIC_API_BASE}/enrollments/${enrollmentId}`,
            { headers }
          );

          if (response.ok) {
            const data = await response.json();
            // Thinkific returns percentage_completed as a number 0-100
            const raw = Number(data.percentage_completed ?? 0);
            const pct = Math.max(0, Math.min(100, Math.round(raw <= 1 && raw > 0 ? raw * 100 : raw)));
            progressResults[enrollmentId] = pct;
            completionInfo[enrollmentId] = {
              percent: pct,
              completed: data.completed === true || pct >= 100 || !!data.completed_at,
              completed_at: data.completed_at || null,
            };
          } else {
            console.error(`Failed to fetch enrollment ${enrollmentId}: ${response.status}`);
            progressResults[enrollmentId] = 0;
          }
        } catch (err) {
          console.error(`Error fetching enrollment ${enrollmentId}:`, err);
          progressResults[enrollmentId] = 0;
        }
      })
    );

    // Persist what we just read so the admin outcomes view and the learner
    // portal are always driven by the same numbers (no drift between views).
    const nowIso = new Date().toISOString();
    let persisted = 0;
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await Promise.all(
        Object.entries(completionInfo).map(async ([id, info]) => {
          const { error } = await admin
            .from('enrollments')
            .update({
              progress_percent: info.percent,
              completed_at: info.completed ? info.completed_at || nowIso : null,
              last_synced_at: nowIso,
            })
            .eq('thinkific_enrollment_id', Number(id));
          if (error) console.error('[thinkific-progress] persist failed', id, error.message);
          else persisted++;
        }),
      );
    } catch (persistErr) {
      console.error('[thinkific-progress] persist skipped', persistErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        progress: progressResults,
        completions: completionInfo,
        persisted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in thinkific-progress:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
