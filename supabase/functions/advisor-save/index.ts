import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function genShareCode(len = 10): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function buildEmailHtml(opts: {
  fullName: string;
  shareUrl: string;
  recommendation: any;
  products: Record<string, any>;
}): string {
  const { fullName, shareUrl, recommendation, products } = opts;
  const primary = recommendation?.primary;
  const product = primary ? products?.[primary.product_slug] : null;
  const productName = product?.name || "Your recommended path";
  const summary = recommendation?.summary || "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0F172A;font-family:Inter,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px;background:linear-gradient(135deg,#6366F1,#8B5CF6,#14B8A6);color:#fff;">
          <h1 style="margin:0;font-size:24px;">Hi ${escapeHtml(fullName || "there")} 👋</h1>
          <p style="margin:8px 0 0;opacity:0.95;">Your personalised learning pathway is ready.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#0F172A;">Your best-fit pick</h2>
          <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#6366F1;">${escapeHtml(productName)}</p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;">${escapeHtml(primary?.headline || "")}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(primary?.reasoning || "")}</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;font-style:italic;background:#F1F5F9;padding:12px;border-radius:8px;">${escapeHtml(primary?.honest_caveat || "")}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(summary)}</p>
          <a href="${shareUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">View full pathway</a>
          <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;">Bookmark or share: <a href="${shareUrl}" style="color:#6366F1;">${shareUrl}</a></p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
          Maarifasasa — Knowledge Now. Opportunity Everywhere.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { answers, recommendation, products, email, full_name, send_email } = body;

    if (!answers || !recommendation) {
      return new Response(JSON.stringify({ error: "answers and recommendation required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Try to get user_id from JWT (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getClaims(token);
        userId = (data?.claims?.sub as string) || null;
      } catch {
        // ignore — guest
      }
    }

    // Generate unique share_code with retry
    let shareCode = genShareCode();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("advisor_assessments")
        .select("id")
        .eq("share_code", shareCode)
        .maybeSingle();
      if (!existing) break;
      shareCode = genShareCode();
    }

    const recommendationWithProducts = { ...recommendation, _products: products || {} };

    const { data: inserted, error: insErr } = await supabase
      .from("advisor_assessments")
      .insert({
        share_code: shareCode,
        user_id: userId,
        email: email || null,
        full_name: full_name || null,
        answers,
        recommendation: recommendationWithProducts,
      })
      .select()
      .single();

    if (insErr || !inserted) {
      console.error("insert error", insErr);
      return new Response(JSON.stringify({ error: "Could not save assessment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://maarifasasa.com";
    const shareUrl = `${origin}/advisor/r/${shareCode}`;

    // Send email if requested and email provided
    if (send_email && email && RESEND_API_KEY) {
      try {
        const html = buildEmailHtml({
          fullName: full_name || "",
          shareUrl,
          recommendation,
          products: products || {},
        });
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Maarifasasa Advisor <hello@maarifasasa.com>",
            to: [email],
            subject: "Your personalised Maarifasasa learning pathway 🎯",
            html,
          }),
        });
        if (!emailRes.ok) {
          const t = await emailRes.text();
          console.warn("email send failed", emailRes.status, t);
        }
      } catch (e) {
        console.warn("email send threw", e);
      }
    }

    return new Response(
      JSON.stringify({ id: inserted.id, share_code: shareCode, share_url: shareUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("advisor-save error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});