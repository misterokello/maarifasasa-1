// Thinkific SSO launch — mints a fresh express sign-in URL for the calling
// learner and returns it so the frontend can open it in a new tab.
//
// Auth: verify_jwt = true (default). We use the caller's JWT to load the
// enrollment via RLS, guaranteeing they can only launch their own course.
// The Thinkific API key stays server-side.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  mintSignInUrl,
  thinkificUserExists,
  THINKIFIC_SIGNIN_URL,
} from "../_shared/thinkificSso.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getThinkificApiKey() {
  const raw = Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific") ?? "";
  return raw.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing auth" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const enrollmentId = body.enrollment_id as string | undefined;
  if (!enrollmentId) return json({ error: "enrollment_id required" }, 400);

  // RLS ensures the caller can only read their own enrollment.
  const { data: enrollment, error: enrErr } = await supabase
    .from("enrollments")
    .select("id, user_id, status, metadata, product:products(thinkific_course_url)")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (enrErr) return json({ error: enrErr.message }, 400);
  if (!enrollment || enrollment.user_id !== userId) return json({ error: "Not found" }, 404);

  // Look up Thinkific user id from the caller's profile (bypasses RLS via service role
  // to keep the query simple and consistent even if profile RLS narrows fields).
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: profile } = await admin
    .from("profiles")
    .select("thinkific_user_id, full_name")
    .eq("id", userId)
    .maybeSingle();

  let thinkificUserId = (profile?.thinkific_user_id as number | null) ?? null;
  const courseUrl = (enrollment as any).product?.thinkific_course_url as string | undefined;
  const apiKey = getThinkificApiKey();

  // Self-heal stale ids: if the Thinkific user no longer exists, clear it so the
  // next provisioning run recreates the account.
  if (thinkificUserId && apiKey) {
    const exists = await thinkificUserExists(apiKey, thinkificUserId);
    if (exists === false) {
      console.warn("[thinkific-launch] stale thinkific_user_id cleared", thinkificUserId);
      await admin
        .from("profiles")
        .update({ thinkific_user_id: null })
        .eq("id", userId);
      thinkificUserId = null;
    }
  }

  const fullName = (profile?.full_name || userData.user.user_metadata?.full_name || "")
    .toString()
    .trim();
  const parts = fullName.split(/\s+/).filter(Boolean);

  const signInUrl = apiKey
    ? await mintSignInUrl(
        apiKey,
        thinkificUserId,
        {
          email: userData.user.email || "",
          first_name: parts[0] || null,
          last_name: parts.slice(1).join(" ") || null,
          external_id: userId,
        },
        courseUrl,
      )
    : null;

  return json({
    url: signInUrl || courseUrl || THINKIFIC_SIGNIN_URL,
    sso: Boolean(signInUrl),
    pending: enrollment.status === "pending_sync",
  });
});