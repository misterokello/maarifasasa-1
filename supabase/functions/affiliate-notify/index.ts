import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

/**
 * Only trusted callers may trigger branded emails:
 *  - server-to-server callers presenting the internal shared secret
 *  - a signed-in admin / affiliate_admin (used by the admin UI)
 */
async function authorize(req: Request): Promise<boolean> {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (internalSecret && req.headers.get("x-internal-secret") === internalSecret) return true;

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  for (const role of ["admin", "affiliate_admin"]) {
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: role });
    if (data === true) return true;
  }
  return false;
}

interface AffiliateNotificationRequest {
  type: "application_approved" | "commission_earned";
  affiliate_email: string;
  affiliate_name: string;
  // For commission_earned
  product_name?: string;
  commission_amount?: number;
  order_amount?: number;
  currency?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!(await authorize(req))) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const body: AffiliateNotificationRequest = await req.json();
    const { type, affiliate_email, affiliate_name } = body;

    if (!type || !affiliate_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let html: string;
    const name = affiliate_name || "Affiliate";

    if (type === "application_approved") {
      subject = "Your Affiliate Application Has Been Approved! 🎉";
      html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to the Affiliate Program! 🎉</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px;">Hi ${name},</p>
            <p>Great news! Your affiliate application has been <strong>approved</strong>. You can now start earning commissions by sharing courses with your network.</p>
            
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">What's Next?</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Visit your <strong>Affiliate Dashboard</strong> to generate your unique referral links</li>
                <li style="margin-bottom: 8px;">Share links with your network via social media, email, or your website</li>
                <li style="margin-bottom: 8px;">Earn commissions on every successful purchase through your links</li>
              </ol>
            </div>

            <p style="text-align: center; margin: 25px 0;">
              <a href="https://affiliates.maarifasasa.com/dashboard" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Affiliate Dashboard</a>
            </p>
            
            <p>If you have any questions, feel free to reach out to us at <a href="mailto:info@maarifasasa.com">info@maarifasasa.com</a>.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Maarifasasa Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;
    } else if (type === "commission_earned") {
      const { product_name, commission_amount, order_amount, currency } = body;
      const formattedCommission = currency === "UGX"
        ? `UGX ${Number(commission_amount || 0).toLocaleString()}`
        : `$${Number(commission_amount || 0).toFixed(2)}`;
      const formattedOrder = currency === "UGX"
        ? `UGX ${Number(order_amount || 0).toLocaleString()}`
        : `$${Number(order_amount || 0).toFixed(2)}`;

      subject = `New Commission Earned: ${formattedCommission} 💰`;
      html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Commission Earned! 💰</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px;">Hi ${name},</p>
            <p>Someone just made a purchase through your referral link. Here are the details:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Product:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${product_name || "Course"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Order Amount:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${formattedOrder}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Your Commission:</strong></td>
                  <td style="padding: 10px 0; color: #10b981; font-weight: bold; font-size: 18px;">${formattedCommission}</td>
                </tr>
              </table>
            </div>

            <p style="text-align: center; margin: 25px 0;">
              <a href="https://affiliates.maarifasasa.com/dashboard" style="display: inline-block; background: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">View Your Earnings</a>
            </p>

            <p style="font-size: 13px; color: #666;">Note: Commissions are pending until approved by our team. You'll be notified when payouts are processed.</p>
            
            <p style="margin-top: 30px;">Keep sharing!<br><strong>Maarifasasa Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Maarifasasa <noreply@maarifasasa.com>",
      to: [affiliate_email],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending affiliate notification:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Affiliate notification sent:", { type, affiliate_email, data });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in affiliate-notify:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
