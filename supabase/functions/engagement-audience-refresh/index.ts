import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, verifyAdmin } from "../_shared/engagement-auth.ts";
import { materializeAudience } from "../_shared/engagement-audiences.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { audience_id, preview } = await req.json();
    if (!audience_id) throw new Error("audience_id required");
    const recipients = await materializeAudience(audience_id);
    return new Response(JSON.stringify({
      member_count: recipients.length,
      recipients: preview ? recipients.slice(0, 50) : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});