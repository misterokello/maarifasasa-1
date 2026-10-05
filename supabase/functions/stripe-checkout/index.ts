import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import {
  applyDiscount,
  createPendingRedemption,
  resolveDiscountForProduct,
} from "../_shared/discounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  product_slug: string;
  payer_email: string;
  payer_name: string;
  success_url: string;
  cancel_url: string;
  referral_code?: string;
  is_installment?: boolean;
  discount_code?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { product_slug, payer_email, payer_name, success_url, cancel_url, referral_code, is_installment, discount_code }: CheckoutRequest = await req.json();

    if (!product_slug || !payer_email || !payer_name || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    const baseAmountUSD = isBootcampInstallment ? Math.ceil(product.price_usd / 2) : product.price_usd;

    // Re-derive the discount server-side; the browser cannot alter the price.
    const discount = await resolveDiscountForProduct(supabase, discount_code, product.id);
    const chargeAmountUSD = discount ? applyDiscount(baseAmountUSD, discount.percentOff) : baseAmountUSD;

    // Create payment record first
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        product_id: product.id,
        amount: chargeAmountUSD * 100, // Store in cents
        currency: "USD",
        payment_method: "stripe",
        status: "pending",
        payer_email: payer_email,
        payer_name: payer_name,
        metadata: {
          product_name: product.name,
          product_slug: product.slug,
          referral_code: referral_code || null,
          discount_code: discount?.code || null,
          discount_percent: discount?.percentOff ?? null,
          discount_amount: discount ? baseAmountUSD - chargeAmountUSD : null,
          undiscounted_amount: baseAmountUSD,
          is_installment: isBootcampInstallment,
          installment_number: isBootcampInstallment ? 1 : null,
          total_price_usd: product.price_usd,
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
        currency: "USD",
        originalAmount: baseAmountUSD,
        chargedAmount: chargeAmountUSD,
      });
    }

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: payer_email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: payer_email,
        name: payer_name,
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout session
    const installmentDescription = isBootcampInstallment
      ? `${product.description || product.name} — 50% Installment (1 of 2)`
      : product.description || undefined;
    const productDescription = discount
      ? `${installmentDescription || product.name} — ${discount.percentOff}% off with code ${discount.code}`
      : installmentDescription;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      customer_update: {
        name: "auto",
        address: "auto",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isBootcampInstallment ? `${product.name} — 50% Installment` : product.name,
              description: productDescription,
            },
            unit_amount: chargeAmountUSD * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${success_url}?payment_id=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancel_url}?payment_id=${payment.id}`,
      metadata: {
        payment_id: payment.id,
        product_slug: product.slug,
        product_id: product.id,
        referral_code: referral_code || "",
        affiliate_code: referral_code || "",
        discount_code: discount?.code || "",
        user_id: "",  // guest checkout – no auth user
      },
    });

    // Update payment with Stripe session ID
    await supabase
      .from("payments")
      .update({
        provider_reference: session.id,
        metadata: {
          ...payment.metadata,
          stripe_session_id: session.id,
        },
      })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        payment_id: payment.id,
        session_id: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in stripe-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
