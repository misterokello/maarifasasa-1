import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://maarifasasa.com";
const FROM = "Maarifasasa Academy <noreply@maarifasasa.com>";

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function inviteHtml(name: string, org: string, link: string) {
  return `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Your learning account is waiting</h1>
  </div>
  <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
    <p style="font-size:17px;margin-top:0;">Hi <strong>${esc(name || "there")}</strong>,</p>
    <p style="color:#555;">${org ? `${esc(org)} has` : "We have"} reserved a Maarifasasa Academy place for you, but your password is not set yet — so you cannot start your courses.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${esc(link)}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Set your password &amp; start learning →</a>
    </p>
    <p style="color:#999;font-size:12px;">This link expires in 24 hours. If it expires, use "Forgot password" on ${SITE_URL}/auth with this email address.</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !user) return json({ error: "Invalid token" }, 401);

    const body = await req.json().catch(() => ({}));
    const groupName = String(body?.group_name ?? "").trim();
    const emails: string[] = Array.isArray(body?.emails)
      ? body.emails.map((e: unknown) => String(e ?? "").trim().toLowerCase()).filter(Boolean).slice(0, 100)
      : [];
    if (!groupName) return json({ error: "group_name is required" }, 400);
    if (emails.length === 0) return json({ error: "No learners selected" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Authorisation: the caller must own this group, or be an admin / learner admin.
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "learner_admin");
    let allowed = isAdmin;
    if (!allowed) {
      const { data: owns } = await userClient.rpc("partner_owns_group", { _group_name: groupName });
      allowed = owns === true;
    }
    if (!allowed) return json({ error: "Not authorised for this group" }, 403);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Email service is not configured" }, 500);
    const resend = new Resend(resendKey);

    const { data: members } = await admin
      .from("partner_group_members")
      .select("email, full_name, invite_count")
      .ilike("thinkific_group_name", groupName);
    const memberMap = new Map(
      (members || []).map((m: any) => [String(m.email).toLowerCase(), m]),
    );

    const { data: group } = await admin
      .from("partner_groups")
      .select("organization_name")
      .ilike("thinkific_group_name", groupName)
      .maybeSingle();
    const org = group?.organization_name ?? "";

    const results: any[] = [];
    for (const email of emails) {
      const member = memberMap.get(email);
      if (!member) {
        results.push({ email, status: "failed", detail: "Not a member of this group" });
        continue;
      }
      try {
        const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${SITE_URL}/reset-password` },
        });
        if (linkErr || !link?.properties?.action_link) {
          throw new Error(linkErr?.message || "Could not create a sign-in link");
        }
        const { error: sendErr } = await resend.emails.send({
          from: FROM,
          to: [email],
          subject: "Set your password and start learning",
          html: inviteHtml(member.full_name ?? "", org, link.properties.action_link),
        });
        if (sendErr) {
          throw new Error(typeof sendErr === "string" ? sendErr : JSON.stringify(sendErr));
        }
        await admin
          .from("partner_group_members")
          .update({
            last_invited_at: new Date().toISOString(),
            invite_count: (member.invite_count ?? 0) + 1,
          })
          .ilike("thinkific_group_name", groupName)
          .eq("email", email);
        results.push({ email, status: "sent" });
      } catch (e) {
        console.error("[partner-resend-invite] failed for", email, e);
        results.push({ email, status: "failed", detail: (e as Error).message });
      }
    }

    return json({
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (e) {
    console.error("[partner-resend-invite] error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
