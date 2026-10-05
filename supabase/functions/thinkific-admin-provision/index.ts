// Admin-only endpoint to (re)provision Thinkific accounts for one or all
// learners who don't yet have a linked thinkific_user_id. Verifies the caller
// holds the `admin` role in user_roles before doing any work.
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findOrCreateThinkificUser, THINKIFIC_API_BASE, thinkificHeaders } from "../_shared/thinkificUsers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getThinkificAccessToken(): string | null {
  const raw = Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific");
  const token = raw?.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  return token || null;
}


async function triggerPasswordReset(apiKey: string, email: string) {
  try {
    await fetch(`${THINKIFIC_API_BASE}/users/reset_password`, {
      method: "POST",
      headers: thinkificHeaders(apiKey),
      body: JSON.stringify({ email }),
    });
  } catch (err) {
    console.error("[thinkific-admin-provision] reset_password failed:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify admin role
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = getThinkificAccessToken();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Thinkific API token not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const scope: "one" | "all_missing" = body.user_id ? "one" : "all_missing";

    const PROFILE_COLS = "id, email, full_name, phone, gender, country, location, age_range";
    let targets: Array<any> = [];
    if (scope === "one") {
      const { data } = await admin.from("profiles").select(PROFILE_COLS).eq("id", body.user_id).maybeSingle();
      if (data) targets = [data as any];
    } else {
      const { data } = await admin
        .from("profiles")
        .select(PROFILE_COLS)
        .is("thinkific_user_id", null)
        .not("email", "is", null);
      targets = (data as any) || [];
    }

    const results: any[] = [];
    for (const p of targets) {
      if (!p.email) continue;
      try {
        const parts = (p.full_name || "").trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] || p.email.split("@")[0];
        const lastName = parts.slice(1).join(" ") || "";
        const { userId, isNew } = await findOrCreateThinkificUser(apiKey, p.email, firstName, lastName, p);

        if (isNew) await triggerPasswordReset(apiKey, p.email);
        await admin.from("profiles").update({
          thinkific_user_id: userId,
          thinkific_synced_at: new Date().toISOString(),
        }).eq("id", p.id);
        results.push({ id: p.id, email: p.email, thinkific_user_id: userId, is_new: isNew, ok: true });
      } catch (err: any) {
        console.error("[thinkific-admin-provision] error for", p.email, err);
        results.push({ id: p.id, email: p.email, ok: false, error: err?.message || String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[thinkific-admin-provision] fatal:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});