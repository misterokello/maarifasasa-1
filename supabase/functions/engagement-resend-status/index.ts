import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, verifyAdmin } from "../_shared/engagement-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const headers = { Authorization: `Bearer ${key}` };

  // Resend does not expose a public plan/quota endpoint via REST. We fetch
  // verified domains + recent emails to derive sensible signals; the rest is
  // surfaced as a link to the Resend dashboard.
  let domains: any[] = [];
  let domainError: string | null = null;
  try {
    const r = await fetch("https://api.resend.com/domains", { headers });
    const j = await r.json();
    if (r.ok) domains = j?.data ?? [];
    else domainError = j?.message ?? `Status ${r.status}`;
  } catch (e) {
    domainError = (e as Error).message;
  }

  // Derive sending volume from our own log for last 30 days
  const supabase = (await import("npm:@supabase/supabase-js@2")).createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: sentLast30 } = await supabase
    .from("email_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", since);
  const { count: bouncedLast30 } = await supabase
    .from("email_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("status", "bounced")
    .gte("created_at", since);

  return new Response(JSON.stringify({
    provider: "resend",
    domains,
    domainError,
    sentLast30: sentLast30 ?? 0,
    bouncedLast30: bouncedLast30 ?? 0,
    docs: {
      pricing: "https://resend.com/pricing",
      limits: "https://resend.com/docs/api-reference/api-keys/rate-limits",
    },
    notes: "Resend has no public quota endpoint. Open the Resend dashboard to view your plan tier and current monthly usage. We track per-campaign delivery here.",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});