// Provision a Thinkific user for the currently signed-in Lovable Cloud user.
// Called right after signup (and idempotently thereafter) so the learner's
// LMS account is ready before they hit the dashboard — no course enrollment,
// just user creation + profile back-write + password-setup email for new
// Thinkific accounts.
//
// Auth: requires a valid Supabase user JWT (Authorization: Bearer <token>).
// The function derives identity from the token — the client cannot spoof
// another user's email.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findOrCreateThinkificUser } from "../_shared/thinkificUsers.ts";
import { mintSignInUrl, thinkificUserExists } from "../_shared/thinkificSso.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";
const SUBDOMAIN = "maarifasasa";
const THINKIFIC_SIGNIN_URL = `https://${SUBDOMAIN}.thinkific.com/users/sign_in`;

function getThinkificAccessToken(): string | null {
  const raw = Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific");
  const token = raw?.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  return token || null;
}

function thinkificHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

async function triggerPasswordReset(apiKey: string, email: string) {
  try {
    await fetch(`${THINKIFIC_API_BASE}/users/reset_password`, {
      method: "POST",
      headers: thinkificHeaders(apiKey),
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    console.error("[thinkific-user-provision] reset_password failed:", err);
  }
}

function signIn(
  apiKey: string,
  thinkificUserId: number | null,
  user: any,
  profile: any,
  returnTo: string | null,
) {
  const fullName = (profile?.full_name || user.user_metadata?.full_name || "").toString().trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  return mintSignInUrl(
    apiKey,
    thinkificUserId,
    {
      email: user.email || "",
      first_name: parts[0] || null,
      last_name: parts.slice(1).join(" ") || null,
      external_id: user.id,
    },
    returnTo,
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Optional deep link: where the learner should land inside Thinkific after
    // the express (SSO) sign-in completes.
    let returnTo: string | null = null;
    try {
      const body = await req.json();
      const candidate = typeof body?.return_to === "string" ? body.return_to.trim() : "";
      if (candidate.startsWith(`https://${SUBDOMAIN}.thinkific.com`)) returnTo = candidate;
    } catch { /* no body */ }

    const email = user.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "User has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = getThinkificAccessToken();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Thinkific API token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for profile back-write
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("thinkific_user_id, full_name, phone, gender, country, location, age_range")
      .eq("id", user.id)
      .maybeSingle();

    // Already provisioned and the Thinkific account still exists — reuse it.
    if (profile?.thinkific_user_id) {
      const stillExists = await thinkificUserExists(apiKey, profile.thinkific_user_id);
      if (stillExists !== false) {
        const signInUrl = await signIn(apiKey, profile.thinkific_user_id, user, profile, returnTo);
        return new Response(
          JSON.stringify({
            success: true,
            user_id: profile.thinkific_user_id,
            is_new_user: false,
            already_linked: true,
            express_sign_in_url: signInUrl,
            thinkific_sign_in_url: THINKIFIC_SIGNIN_URL,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      // Stale id — clear it and re-provision below.
      console.warn("[thinkific-user-provision] stale thinkific_user_id cleared", profile.thinkific_user_id);
      await admin.from("profiles").update({ thinkific_user_id: null }).eq("id", user.id);
    }

    const fullName = (profile?.full_name || user.user_metadata?.full_name || "").toString().trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || email.split("@")[0];
    const lastName = parts.slice(1).join(" ") || "";

    const { userId, isNew } = await findOrCreateThinkificUser(apiKey, email, firstName, lastName, profile || {});

    if (isNew) {
      await triggerPasswordReset(apiKey, email);
    }

    const expressSignInUrl = await signIn(apiKey, userId, user, profile, returnTo);

    await admin
      .from("profiles")
      .update({
        thinkific_user_id: userId,
        thinkific_synced_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        is_new_user: isNew,
        already_linked: false,
        express_sign_in_url: expressSignInUrl,
        thinkific_sign_in_url: THINKIFIC_SIGNIN_URL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[thinkific-user-provision] error:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});