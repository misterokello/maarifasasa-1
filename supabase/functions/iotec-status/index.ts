import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { enqueueEnrollment } from "../_shared/enrollments.ts";
import { markRedemptionPaid } from "../_shared/discounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THINKIFIC_SUBDOMAIN = "maarifasasa";
const THINKIFIC_SIGNIN_URL = `https://${THINKIFIC_SUBDOMAIN}.thinkific.com/users/sign_in`;

// Helper to create affiliate conversion from referral code
async function createAffiliateConversion(
  supabase: any,
  payment: Record<string, any>,
  product: Record<string, any>
) {
  const referralCode = payment.metadata?.referral_code;
  if (!referralCode) return;

  try {
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_id, product_id")
      .eq("code", referralCode)
      .maybeSingle();

    if (!link) return;

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, status, commission_rate_override")
      .eq("id", link.affiliate_id)
      .maybeSingle();

    if (!affiliate || affiliate.status !== "approved") return;

    let commissionPercent = 0;
    if (affiliate.commission_rate_override != null) {
      commissionPercent = Number(affiliate.commission_rate_override);
    } else {
      const { data: affProduct } = await supabase
        .from("affiliate_products")
        .select("commission_percent")
        .eq("product_id", link.product_id)
        .eq("is_active", true)
        .maybeSingle();
      commissionPercent = affProduct ? Number(affProduct.commission_percent) : 0;
    }

    if (commissionPercent <= 0) return;

    // ioTec amounts are already in UGX (not cents)
    const orderAmount = payment.amount;
    const commissionAmount = (orderAmount * commissionPercent) / 100;

    await supabase.from("affiliate_conversions").insert({
      affiliate_id: link.affiliate_id,
      link_id: link.id,
      payment_id: payment.id,
      product_id: link.product_id,
      order_amount: orderAmount,
      commission_amount: commissionAmount,
      currency: payment.currency,
      status: "pending",
    });

    await supabase.rpc("increment_affiliate_earnings", {
      affiliate_id_param: link.affiliate_id,
      amount_param: commissionAmount,
    });

    // Send commission notification email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const { data: affRecord } = await supabase
      .from("affiliates")
      .select("user_id")
      .eq("id", link.affiliate_id)
      .maybeSingle();

    if (affRecord?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", affRecord.user_id)
        .maybeSingle();

      if (profile?.email) {
        fetch(`${supabaseUrl}/functions/v1/affiliate-notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "",
          },
          body: JSON.stringify({
            type: "commission_earned",
            affiliate_email: profile.email,
            affiliate_name: profile.full_name || "Affiliate",
            product_name: product?.name,
            commission_amount: commissionAmount,
            order_amount: orderAmount,
            currency: payment.currency,
          }),
        }).catch(err => console.error("Failed to send commission notification:", err));
      }
    }

    console.log("Affiliate conversion created for mobile money payment");
  } catch (err) {
    console.error("Error creating affiliate conversion:", err);
  }
}

// Helper to notify the external Maarifasasa Affiliates system for ioTec payments
async function notifyExternalAffiliateIotec(
  payment: Record<string, any>,
  product: Record<string, any>
) {
  const affiliateCode =
    payment.metadata?.referral_code ||
    payment.metadata?.affiliate_code;

  if (!affiliateCode) return;

  const anonKey = Deno.env.get("AFFILIATE_SYSTEM_ANON_KEY");
  if (!anonKey) {
    console.warn("[iotec-status] AFFILIATE_SYSTEM_ANON_KEY not set, skipping external notification");
    return;
  }

  const body = {
    order_id: payment.id,
    iotec_reference: payment.provider_reference || "",
    status: "success",
    user_id: payment.user_id || "",
    product_id: product.id,
    amount: payment.amount,
    currency: payment.currency,
    affiliate_code: affiliateCode,
  };

  try {
    const res = await fetch(
      "https://ujbzhauwcdmtdegthwbf.supabase.co/functions/v1/iotec-webhook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(body),
      }
    );
    const text = await res.text();
    console.log(
      `[iotec-status] External affiliate notified: status=${res.status}`,
      text
    );
  } catch (err) {
    console.error("[iotec-status] Failed to notify external affiliate system:", err);
  }
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

// Helper to enroll user in Thinkific and get express sign-in URL
async function enrollInThinkific(
  supabaseUrl: string,
  payment: Record<string, any>,
  product: Record<string, any>
): Promise<{ expressSignInUrl?: string; isNewUser?: boolean } | null> {
  if (!product?.thinkific_course_id) {
    console.log("No Thinkific course ID configured for this product, skipping enrollment");
    return null;
  }

  const customerEmail = payment.payer_email;
  const customerName = payment.payer_name || "";
  
  if (!customerEmail) {
    console.log("No customer email found, skipping Thinkific enrollment");
    return null;
  }

  // Parse first and last name
  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || customerEmail.split('@')[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  try {
    const enrollmentResponse = await fetch(`${supabaseUrl}/functions/v1/thinkific-enrollment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'x-internal-secret': Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '',
      },
      body: JSON.stringify({
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
        course_id: product.thinkific_course_id,
        payment_id: payment.id,
        phone: payment.payer_phone,
      }),
    });

    if (enrollmentResponse.ok) {
      const enrollmentData = await enrollmentResponse.json();
      console.log("Thinkific enrollment successful:", enrollmentData);
      return {
        expressSignInUrl: enrollmentData.express_sign_in_url,
        isNewUser: enrollmentData.is_new_user,
      };
    } else {
      const errorText = await enrollmentResponse.text();
      console.error("Thinkific enrollment failed:", errorText);
      return null;
    }
  } catch (err) {
    console.error("Error calling Thinkific enrollment:", err);
    return null;
  }
}

// Helper to send payment confirmation email with express sign-in URL
async function sendPaymentConfirmationEmail(
  resend: InstanceType<typeof Resend>,
  payment: Record<string, any>,
  product: Record<string, any> | null,
  thinkificData?: { expressSignInUrl?: string; isNewUser?: boolean }
) {
  const customerEmail = payment.payer_email;
  if (!customerEmail) {
    console.log("No customer email found, skipping confirmation email");
    return;
  }

  const customerName = payment.payer_name || "Valued Customer";
  const productName = product?.name || "Course/Program";
  const amount = payment.amount;
  const currency = payment.currency;

  const formattedAmount = currency === "UGX" 
    ? `UGX ${amount.toLocaleString()}` 
    : `$${amount.toFixed(2)}`;

  // Build Thinkific access section with express sign-in URL
  let thinkificNote = "";
  if (product?.thinkific_course_id) {
    const expressUrl = thinkificData?.expressSignInUrl;
    const isNewUser = thinkificData?.isNewUser;
    
    // Primary button: Express sign-in if available, otherwise regular sign-in
    const signInButton = expressUrl 
      ? `<a href="${expressUrl}" target="_blank" rel="noreferrer" style="display: inline-block; background: #2e7d32; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Access Your Course Now</a>`
      : `<a href="${THINKIFIC_SIGNIN_URL}" target="_blank" rel="noreferrer" style="display: inline-block; background: #2e7d32; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Sign in to Thinkific</a>`;

    // Direct course link if available
    const courseLink = product.thinkific_course_url 
      ? `<p style="margin: 10px 0 0 0;">
          <a href="${product.thinkific_course_url}" target="_blank" rel="noreferrer" style="display: inline-block; background: #1565c0; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600;">Go to Your Course</a>
        </p>`
      : "";

    // New user message about password reset
    const newUserNote = isNewUser 
      ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #1b5e20;">📧 <strong>New Account:</strong> We've sent you a password reset email to set up your account password. Please check your inbox.</p>`
      : "";
    
    thinkificNote = `<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>🎓 Course Access:</strong> Your course is ready and waiting for you!</p>
        <p style="margin: 0 0 15px 0;">Click below to access your learning dashboard:</p>
        <p style="margin: 0;">
          ${signInButton}
        </p>
        ${courseLink}
        ${newUserNote}
       </div>`;
  } else {
    thinkificNote = `<p>You will receive further instructions about accessing your course/program shortly.</p>`;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Maarifasasa <noreply@maarifasasa.com>",
      to: [customerEmail],
      subject: `Payment Confirmation - ${productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed! ✓</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px;">Hi ${customerName},</p>
            <p>Thank you for your payment! Your transaction has been successfully processed via Mobile Money.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="margin-top: 0; color: #667eea;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Product:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Mobile Money</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Reference:</strong></td>
                  <td style="padding: 8px 0;">${payment.id}</td>
                </tr>
              </table>
            </div>
            
            ${thinkificNote}
            
            <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:info@maarifasasa.com">info@maarifasasa.com</a>.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Maarifasasa Team</strong>
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending confirmation email:", error);
    } else {
      console.log("Payment confirmation email sent successfully:", data);
    }
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { payment_id }: { payment_id: string } = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing payment_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch payment record with product info
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, products(*)")
      .eq("id", payment_id)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment fetch error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed, return current status
    if (payment.status === "success" || payment.status === "failed") {
      return new Response(
        JSON.stringify({
          status: payment.status,
          payment_id: payment.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactionId = payment.provider_reference;
    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "No transaction ID found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ioTec access token
    const accessToken = await getIotecToken();

    // Check transaction status
    const statusResponse = await fetch(
      `https://pay.iotec.io/api/collections/status/${transactionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error("ioTec status error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check payment status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json();
    console.log("ioTec status response:", statusData);

    // Map ioTec status to our status
    let newStatus = payment.status;
    const iotecStatus = (statusData.status || statusData.Status || "").toLowerCase();

    if (iotecStatus === "success" || iotecStatus === "successful" || iotecStatus === "completed") {
      newStatus = "success";
    } else if (iotecStatus === "failed" || iotecStatus === "rejected" || iotecStatus === "cancelled") {
      newStatus = "failed";
    } else if (iotecStatus === "pending" || iotecStatus === "processing") {
      newStatus = "processing";
    }

    // Update payment record if status changed
    if (newStatus !== payment.status) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        metadata: {
          ...payment.metadata,
          iotec_status_response: statusData,
        },
      };

      if (newStatus === "success") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", payment_id);

      if (updateError) {
        console.error("Payment update error:", updateError);
      } else if (newStatus === "success") {
        // Mark the discount-code redemption as paid (if any) and roll up commission
        await markRedemptionPaid(supabase, payment.id);

        // Create affiliate conversion if referral code present (local DB)
        await createAffiliateConversion(supabase, payment, payment.products);

        // Notify external affiliate system
        await notifyExternalAffiliateIotec(payment, payment.products);

        // Phase 4: decoupled enrollment — worker sends the access email.
        await enqueueEnrollment(supabase, { payment, product: payment.products });

        // Issue + email the branded invoice and receipt PDFs.
        await issueDocuments(payment.id);


        // Send payment receipt only (no Thinkific sign-in URL here).
        if (resend) {
          await sendPaymentConfirmationEmail(resend, payment, payment.products, undefined);
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: newStatus,
        payment_id: payment.id,
        iotec_status: iotecStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in iotec-status:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fire the payment-documents function to generate + email the invoice/receipt.
async function issueDocuments(paymentId: string) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-documents`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") || "",
      },
      body: JSON.stringify({ action: "issue", payment_id: paymentId, send_email: true }),
    });
    console.log(`[invoice] payment-documents status=${res.status}`, await res.text());
  } catch (err) {
    console.error("[invoice] Failed to issue payment documents:", err);
  }
}
