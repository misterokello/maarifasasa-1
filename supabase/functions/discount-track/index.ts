import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyPartner } from "../_shared/partnerNotify.ts";

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

async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const rawCode = String(body.code || "").trim();

    if (!rawCode || !["click", "signup"].includes(action)) {
      return json({ error: "Invalid request" }, 400);
    }

    const { data: code } = await supabase
      .from("discount_codes")
      .select("id, clicks, signups_count, is_active")
      .ilike("code", rawCode)
      .maybeSingle();

    if (!code) return json({ ok: true, tracked: false });

    if (action === "click") {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        "";

      await supabase.from("discount_code_clicks").insert({
        discount_code_id: code.id,
        ip_hash: ip ? await hashIp(ip) : null,
        user_agent: (req.headers.get("user-agent") || "").slice(0, 500),
        referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
        landing_path: body.landing_path ? String(body.landing_path).slice(0, 500) : null,
      });

      await supabase
        .from("discount_codes")
        .update({ clicks: (code.clicks ?? 0) + 1 })
        .eq("id", code.id);

      return json({ ok: true, tracked: true });
    }

    // action === "signup" — requires a verified caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData } = await anonClient.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { error: insErr } = await supabase.from("discount_code_signups").insert({
      discount_code_id: code.id,
      user_id: userId,
      email: userData.user?.email || null,
      full_name: body.full_name ? String(body.full_name).slice(0, 200) : null,
    });

    // Duplicate signup attribution is a no-op
    if (insErr) {
      if (`${insErr.message}`.toLowerCase().includes("duplicate")) {
        return json({ ok: true, tracked: false, duplicate: true });
      }
      console.error("[discount-track] signup insert error", insErr);
      return json({ error: "Failed to attribute signup" }, 500);
    }

    await supabase
      .from("discount_codes")
      .update({ signups_count: (code.signups_count ?? 0) + 1 })
      .eq("id", code.id);

    await notifyPartner(supabase, code.id, {
      event: "signup",
      personName: body.full_name ? String(body.full_name).slice(0, 200) : null,
    });

    return json({ ok: true, tracked: true });
  } catch (error) {
    console.error("[discount-track] error", error);
    return json({ error: (error as Error).message || "Internal server error" }, 500);
  }
});