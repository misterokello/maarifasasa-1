import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the affiliate link by code
    const { data: link, error: linkError } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_id")
      .eq("code", code)
      .maybeSingle();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check affiliate is still approved
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("status")
      .eq("id", link.affiliate_id)
      .maybeSingle();

    if (!affiliate || affiliate.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Affiliate not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate: check if same IP clicked this link within the last hour
    const ipRaw = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const ip = ipRaw.split(",")[0].trim();
    // Simple hash for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "affiliate-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentClick } = await supabase
      .from("affiliate_clicks")
      .select("id")
      .eq("link_id", link.id)
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo)
      .limit(1);

    if (recentClick && recentClick.length > 0) {
      return new Response(
        JSON.stringify({ success: true, deduplicated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the click
    const userAgent = req.headers.get("user-agent") || null;
    const referrer = req.headers.get("referer") || null;

    await supabase.from("affiliate_clicks").insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer: referrer,
    });

    // Increment click counter on the link
    await supabase.rpc("increment_affiliate_clicks", { link_id_param: link.id });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in affiliate-track:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
