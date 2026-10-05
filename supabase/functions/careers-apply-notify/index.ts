import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ application_id: z.string().uuid() });

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: app, error } = await supabase
      .from("job_applications")
      .select("id, full_name, email, job_posting_id, job_postings(title, slug, department, location)")
      .eq("id", parsed.data.application_id)
      .maybeSingle();
    if (error || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("recruitment_audit_log").insert({
      entity_type: "job_application",
      entity_id: app.id,
      action: "application_submitted",
      actor_label: app.email,
      payload: { job_posting_id: app.job_posting_id },
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const role = (app as any).job_postings?.title ?? "the role";

    // Applicant confirmation
    await resend.emails.send({
      from: "Maarifasasa Careers <careers@maarifasasa.com>",
      to: [app.email],
      subject: `Application received — ${role}`,
      html: `<!doctype html><html><body style="font-family:'Segoe UI',sans-serif;color:#1a1a2e;max-width:600px;margin:0 auto;padding:24px;background:#f5f5f5;">
        <div style="background:linear-gradient(135deg,#FF6B35,#FF8C42);padding:28px;border-radius:12px 12px 0 0;text-align:center;color:#fff;">
          <h1 style="margin:0;font-size:22px;">Application received ✓</h1>
        </div>
        <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;">
          <p>Hi <strong>${esc(app.full_name)}</strong>,</p>
          <p>Thank you for applying for <strong>${esc(role)}</strong> at Maarifasasa. Our team will review your application carefully and get back to you within 10 working days of the closing date.</p>
          <p>We are an equal opportunity employer and value diversity in our teams.</p>
          <p style="margin-top:24px;color:#555;font-size:14px;">If you have questions, reply to this email or write to <a href="mailto:careers@maarifasasa.com" style="color:#FF6B35;">careers@maarifasasa.com</a>.</p>
          <p style="margin-top:24px;">Warm regards,<br/><strong style="color:#FF6B35;">The Maarifasasa Hiring Team</strong></p>
        </div>
      </body></html>`,
    }).catch((e) => console.error("applicant email failed", e));

    // HR notification
    await resend.emails.send({
      from: "Maarifasasa Careers <careers@maarifasasa.com>",
      to: ["careers@maarifasasa.com"],
      subject: `New application: ${role} — ${app.full_name}`,
      html: `<p><strong>${esc(app.full_name)}</strong> (${esc(app.email)}) applied for <strong>${esc(role)}</strong>.</p>
        <p>Review in the admin dashboard: <a href="https://maarifasasa.com/admin-hiring?tab=applicants">Open</a></p>`,
    }).catch((e) => console.error("hr email failed", e));

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
