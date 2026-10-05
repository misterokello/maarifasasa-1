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

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      assessment_id,
      full_name,
      email,
      phone,
      preferred_date,
      preferred_time,
      timezone,
      topic,
      notes,
    } = body || {};

    if (!full_name || !email || !preferred_date || !preferred_time) {
      return new Response(
        JSON.stringify({ error: "full_name, email, preferred_date and preferred_time are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isValidDate(preferred_date)) {
      return new Response(JSON.stringify({ error: "Invalid date format (YYYY-MM-DD)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optional user from JWT
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getClaims(token);
        userId = (data?.claims?.sub as string) || null;
      } catch {
        // guest
      }
    }

    const { data: inserted, error: insErr } = await supabase
      .from("mentor_call_requests")
      .insert({
        assessment_id: assessment_id || null,
        user_id: userId,
        full_name: String(full_name).slice(0, 200),
        email: String(email).slice(0, 200),
        phone: phone ? String(phone).slice(0, 50) : null,
        preferred_date,
        preferred_time: String(preferred_time).slice(0, 50),
        timezone: timezone || "Africa/Kampala",
        topic: topic ? String(topic).slice(0, 200) : null,
        notes: notes ? String(notes).slice(0, 2000) : null,
      })
      .select()
      .single();

    if (insErr || !inserted) {
      console.error("insert error", insErr);
      return new Response(JSON.stringify({ error: "Could not save request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirmation email (best-effort)
    if (RESEND_API_KEY) {
      const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0F172A;font-family:Inter,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 16px;"><tr><td align="center">
        <table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px;background:linear-gradient(135deg,#6366F1,#8B5CF6,#14B8A6);color:#fff;">
            <h1 style="margin:0;font-size:22px;">Hi ${escapeHtml(full_name)} 👋</h1>
            <p style="margin:8px 0 0;opacity:0.95;">Your mentor call request is in.</p>
          </td></tr>
          <tr><td style="padding:24px 32px;color:#0F172A;">
            <p style="margin:0 0 12px;font-size:15px;">Thanks for booking a call with the Maarifasasa team. We'll email you a confirmation with a video link within one business day.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 0;color:#64748B;font-size:13px;">Date</td><td style="padding:8px 0;font-weight:600;text-align:right;">${escapeHtml(preferred_date)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748B;font-size:13px;border-top:1px solid #E2E8F0;">Time</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #E2E8F0;">${escapeHtml(preferred_time)} (${escapeHtml(timezone || "Africa/Kampala")})</td></tr>
              ${topic ? `<tr><td style="padding:8px 0;color:#64748B;font-size:13px;border-top:1px solid #E2E8F0;">Topic</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #E2E8F0;">${escapeHtml(topic)}</td></tr>` : ""}
            </table>
            <p style="margin:16px 0 0;font-size:13px;color:#64748B;">If you need to reschedule, reply to this email.</p>
          </td></tr>
          <tr><td style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
            Maarifasasa — Knowledge Now. Opportunity Everywhere.
          </td></tr>
        </table>
      </td></tr></table></body></html>`;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Maarifasasa Advisor <hello@maarifasasa.com>",
            to: [email],
            subject: "Your mentor call request — Maarifasasa",
            html,
          }),
        });

        // Also notify the team
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Maarifasasa Advisor <hello@maarifasasa.com>",
            to: ["hello@maarifasasa.com"],
            subject: `New mentor call request — ${full_name}`,
            html: `<p><strong>${escapeHtml(full_name)}</strong> (${escapeHtml(email)}${phone ? `, ${escapeHtml(phone)}` : ""}) requested a mentor call.</p>
            <ul>
              <li>Date: ${escapeHtml(preferred_date)}</li>
              <li>Time: ${escapeHtml(preferred_time)} (${escapeHtml(timezone || "Africa/Kampala")})</li>
              ${topic ? `<li>Topic: ${escapeHtml(topic)}</li>` : ""}
              ${notes ? `<li>Notes: ${escapeHtml(notes)}</li>` : ""}
              ${assessment_id ? `<li>Assessment: ${escapeHtml(assessment_id)}</li>` : ""}
            </ul>`,
          }),
        });
      } catch (e) {
        console.warn("email send failed", e);
      }
    }

    return new Response(JSON.stringify({ id: inserted.id, ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("mentor-call-request error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});