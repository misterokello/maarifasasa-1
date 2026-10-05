import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyPartner } from "../_shared/partnerNotify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUSES = ["pending", "approved", "paid"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const redemptionId = String(body.redemption_id || "");
    const status = String(body.status || "");
    if (!redemptionId || !STATUSES.includes(status)) {
      return json({ error: "Invalid request" }, 400);
    }

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData } = await userClient.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { data: allowed } = await userClient.rpc("can_manage_discounts");
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await admin
      .from("discount_code_redemptions")
      .update({
        commission_status: status,
        commission_status_updated_at: new Date().toISOString(),
        commission_status_updated_by: userId,
        commission_paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", redemptionId)
      .select("id, discount_code_id, commission_amount, currency, product_id, commission_status");

    if (error) return json({ error: error.message }, 500);
    const row = rows?.[0];
    if (!row) return json({ error: "Redemption not found" }, 404);

    if (status === "paid") {
      let productName: string | null = null;
      if (row.product_id) {
        const { data: prod } = await admin
          .from("products")
          .select("name")
          .eq("id", row.product_id)
          .maybeSingle();
        productName = prod?.name ?? null;
      }
      await notifyPartner(admin, row.discount_code_id, {
        event: "commission_paid",
        productName,
        currency: row.currency,
        commissionAmount: Number(row.commission_amount ?? 0),
      });
    }

    return json({ ok: true, status: row.commission_status });
  } catch (err) {
    console.error("[discount-commission-status] error", err);
    return json({ error: (err as Error).message || "Internal server error" }, 500);
  }
});
