import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applyDiscount,
  createPendingRedemption,
  resolveDiscountForProduct,
} from "../_shared/discounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollectRequest {
  product_slug: string;
  payer_phone: string;
  payer_name: string;
  payer_email: string;
  referral_code?: string;
  is_installment?: boolean;
  discount_code?: string;
}

async function getIotecToken(): Promise<string> {
  const clientId = Deno.env.get("IOTEC_CLIENT_ID");
  const clientSecret = Deno.env.get("IOTEC_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("ioTec credentials not configured");
  }

  const response = await fetch("https://id.iotec.io/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("ioTec auth error:", error);
    throw new Error("Failed to authenticate with ioTec");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const walletId = Deno.env.get("IOTEC_WALLET_ID");

    if (!walletId) {
      throw new Error("ioTec wallet ID not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { product_slug, payer_phone, payer_name, payer_email, referral_code, is_installment, discount_code }: CollectRequest = await req.json();

    if (!product_slug || !payer_phone || !payer_name || !payer_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number - ensure it starts with 256
    let normalizedPhone = payer_phone.replace(/\D/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "256" + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith("256")) {
      normalizedPhone = "256" + normalizedPhone;
    }

    // Fetch product from database
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("slug", product_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product error:", productError);
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate amount based on installment option
    const cat = (product.category || "").toLowerCase();
    const slug = (product.slug || "").toLowerCase();
    const installmentEligible =
      cat === "bootcamp" || cat === "accelerator" || slug === "talent-accelerator";
    const isBootcampInstallment = !!is_installment && installmentEligible;
    const baseAmount = isBootcampInstallment ? Math.ceil(product.price_ugx / 2) : product.price_ugx;

    // Re-derive the discount server-side; the browser cannot alter the price.
    const discount = await resolveDiscountForProduct(supabase, discount_code, product.id);
    const chargeAmount = discount ? applyDiscount(baseAmount, discount.percentOff) : baseAmount;

    // Get ioTec access token
    const accessToken = await getIotecToken();

    // Initiate collection request
    const collectionResponse = await fetch("https://pay.iotec.io/api/collections/collect", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "MobileMoney",
        currency: "UGX",
        walletId: walletId,
        payer: normalizedPhone,
        amount: chargeAmount,
        payerNote: isBootcampInstallment
          ? `50% Installment for ${product.name}`
          : `Payment for ${product.name}`,
        transactionChargesCategory: "ChargeWallet",
      }),
    });

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text();
      console.error("ioTec collection error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to initiate payment", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const collectionData = await collectionResponse.json();
    console.log("ioTec collection response:", collectionData);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        product_id: product.id,
        amount: chargeAmount,
        currency: "UGX",
        payment_method: "mobile_money",
        status: "pending",
        provider_reference: collectionData.transactionId || collectionData.id,
        external_id: collectionData.externalId,
        payer_phone: normalizedPhone,
        payer_email: payer_email,
        payer_name: payer_name,
        metadata: {
          product_name: product.name,
          product_slug: product.slug,
          iotec_response: collectionData,
          referral_code: referral_code || null,
          discount_code: discount?.code || null,
          discount_percent: discount?.percentOff ?? null,
          discount_amount: discount ? baseAmount - chargeAmount : null,
          undiscounted_amount: baseAmount,
          is_installment: isBootcampInstallment,
          installment_number: isBootcampInstallment ? 1 : null,
          total_price_ugx: product.price_ugx,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (discount) {
      await createPendingRedemption(supabase, {
        discount,
        paymentId: payment.id,
        productId: product.id,
        payerEmail: payer_email,
        currency: "UGX",
        originalAmount: baseAmount,
        chargedAmount: chargeAmount,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        transaction_id: collectionData.transactionId || collectionData.id,
        message: "Payment request sent to your phone. Please approve the transaction.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in iotec-collect:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
