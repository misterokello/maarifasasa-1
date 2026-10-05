import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type IntegrationKey =
  | "stripe"
  | "iotec"
  | "thinkific"
  | "resend"
  | "tally"
  | "google_oauth"
  | "lovable_ai";

interface IntegrationStatus {
  key: IntegrationKey;
  label: string;
  configured: boolean;
  missingSecrets: string[];
  testStatus: "ok" | "fail" | "not_run";
  testMessage?: string;
  latencyMs?: number;
}

const INTEGRATIONS: Array<{
  key: IntegrationKey;
  label: string;
  secrets: string[];
}> = [
  { key: "stripe", label: "Stripe", secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { key: "iotec", label: "ioTec Mobile Money", secrets: ["IOTEC_CLIENT_ID", "IOTEC_CLIENT_SECRET", "IOTEC_WALLET_ID"] },
  { key: "thinkific", label: "Thinkific LMS", secrets: ["Thinkific"] },
  { key: "resend", label: "Resend (Email)", secrets: ["RESEND_API_KEY"] },
  { key: "tally", label: "Tally Forms", secrets: ["TALLY_API_KEY"] },
  { key: "google_oauth", label: "Google OAuth", secrets: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"] },
  { key: "lovable_ai", label: "Lovable AI Gateway", secrets: ["LOVABLE_API_KEY"] },
];

function checkConfigured(secrets: string[]): { configured: boolean; missing: string[] } {
  const missing = secrets.filter((s) => !Deno.env.get(s)?.trim());
  return { configured: missing.length === 0, missing };
}

async function testStripe(): Promise<{ ok: boolean; message: string }> {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return { ok: false, message: "STRIPE_SECRET_KEY missing" };
  const res = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `Stripe ${res.status}: ${body.slice(0, 160)}` };
  return { ok: true, message: "Stripe API reachable" };
}

async function testIotec(): Promise<{ ok: boolean; message: string }> {
  const id = Deno.env.get("IOTEC_CLIENT_ID");
  const secret = Deno.env.get("IOTEC_CLIENT_SECRET");
  if (!id || !secret) return { ok: false, message: "ioTec credentials missing" };
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });
  const res = await fetch("https://id.iotec.io/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `ioTec ${res.status}: ${body.slice(0, 160)}` };
  return { ok: true, message: "OAuth token obtained" };
}

async function testThinkific(): Promise<{ ok: boolean; message: string }> {
  const token = (Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific"))
    ?.trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^["']|["']$/g, "");
  if (!token) return { ok: false, message: "Thinkific API Access Token missing" };
  const res = await fetch("https://api.thinkific.com/api/public/v1/courses?limit=1", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `Thinkific ${res.status}: ${body.slice(0, 160)}` };
  return { ok: true, message: "Courses endpoint reachable" };
}

async function testResend(): Promise<{ ok: boolean; message: string }> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, message: "RESEND_API_KEY missing" };
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `Resend ${res.status}: ${body.slice(0, 160)}` };
  return { ok: true, message: "Resend API reachable" };
}

async function testTally(): Promise<{ ok: boolean; message: string }> {
  const key = Deno.env.get("TALLY_API_KEY");
  if (!key) return { ok: false, message: "TALLY_API_KEY missing" };
  const res = await fetch("https://api.tally.so/forms", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, message: `Tally ${res.status}: ${body.slice(0, 160)}` };
  return { ok: true, message: "Tally API reachable" };
}

async function testGoogleOauth(): Promise<{ ok: boolean; message: string }> {
  const id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const secret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!id || !secret) return { ok: false, message: "Google OAuth credentials missing" };
  // Can't validate without a refresh token; just confirm presence + format.
  if (!id.endsWith(".apps.googleusercontent.com")) {
    return { ok: false, message: "GOOGLE_OAUTH_CLIENT_ID format looks wrong" };
  }
  return { ok: true, message: "Credentials present and well-formed" };
}

async function testLovableAi(): Promise<{ ok: boolean; message: string }> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: false, message: "LOVABLE_API_KEY missing" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, message: `Lovable AI ${res.status}: ${body.slice(0, 160)}` };
  }
  await res.text();
  return { ok: true, message: "AI Gateway reachable" };
}

const TESTERS: Record<IntegrationKey, () => Promise<{ ok: boolean; message: string }>> = {
  stripe: testStripe,
  iotec: testIotec,
  thinkific: testThinkific,
  resend: testResend,
  tally: testTally,
  google_oauth: testGoogleOauth,
  lovable_ai: testLovableAi,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) ?? null;
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify admin role server-side
    const { data: roles, error: rolesErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (rolesErr || !roles) {
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "status";
    const targetKey = (url.searchParams.get("integration") as IntegrationKey | null) ?? null;

    if (action === "test") {
      if (!targetKey || !TESTERS[targetKey]) {
        return new Response(JSON.stringify({ error: "Unknown integration" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const started = Date.now();
      let result: { ok: boolean; message: string };
      try {
        result = await TESTERS[targetKey]();
      } catch (err) {
        result = { ok: false, message: (err as Error).message ?? "Unknown error" };
      }
      const latencyMs = Date.now() - started;
      await admin.from("integration_audit_log").insert({
        integration_key: targetKey,
        action: "test",
        actor_id: userId,
        actor_email: userEmail,
        status: result.ok ? "success" : "failure",
        details: { message: result.message, latency_ms: latencyMs },
      });
      return new Response(
        JSON.stringify({ ok: result.ok, message: result.message, latencyMs }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: bulk status report (no live calls, just secret presence)
    const statuses: IntegrationStatus[] = INTEGRATIONS.map((i) => {
      const { configured, missing } = checkConfigured(i.secrets);
      return {
        key: i.key,
        label: i.label,
        configured,
        missingSecrets: missing,
        testStatus: "not_run",
      };
    });

    return new Response(JSON.stringify({ integrations: statuses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("integrations-status error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});