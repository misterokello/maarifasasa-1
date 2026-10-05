import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://maarifasasa.com";
const FROM = "Maarifasasa Partners <partners@maarifasasa.com>";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailHtml(opts: {
  name: string;
  code: string;
  percentOff: number;
  actionLink: string;
  reminder: boolean;
}) {
  const heading = opts.reminder ? "Finish setting up your Partner Portal" : "You're approved — welcome aboard!";
  const intro = opts.reminder
    ? "You haven't set your password yet, so your Partner Portal is still locked. It only takes a minute."
    : "Your referral partnership with Maarifasasa has been approved. Your discount code and tracking link are live.";
  return `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">${esc(heading)}</h1>
  </div>
  <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
    <p style="font-size:17px;margin-top:0;">Hi <strong>${esc(opts.name || "there")}</strong>,</p>
    <p style="color:#555;">${esc(intro)}</p>
    <div style="background:#FAFAFA;border-left:4px solid #FF6B35;padding:16px;border-radius:8px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#777;">Your referral code</p>
      <p style="margin:4px 0 0 0;font-size:22px;font-weight:700;letter-spacing:1px;">${esc(opts.code)}</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#777;">Gives your audience ${opts.percentOff}% off · link: ${SITE_URL}/?dc=${esc(opts.code)}</p>
    </div>
    <p style="color:#555;font-size:14px;">Click below to create your password and open your Partner Portal, where you can track clicks, signups, sales and commission in real time.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${esc(opts.actionLink)}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Create your password →</a>
    </p>
    <p style="color:#999;font-size:12px;">This link expires in 24 hours. If it expires, use "Forgot password" on ${SITE_URL}/auth with this email address.</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: canManage } = await userClient.rpc("can_manage_discounts");
    if (!canManage) {
      return new Response(JSON.stringify({ error: "Discounts admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode: "invite" | "remind" = body?.mode === "remind" ? "remind" : "invite";
    const ids: string[] = Array.isArray(body?.discount_code_ids)
      ? body.discount_code_ids.filter((v: unknown) => typeof v === "string").slice(0, 200)
      : [];
    if (mode === "invite" && ids.length === 0) {
      return new Response(JSON.stringify({ error: "discount_code_ids is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    let query = admin
      .from("discount_codes")
      .select("id, code, percent_off, owner_name, owner_email, owner_user_id, portal_activated_at")
      .not("owner_email", "is", null);
    if (ids.length > 0) query = query.in("id", ids);
    if (mode === "remind") query = query.is("portal_activated_at", null);

    const { data: codes, error: codesErr } = await query;
    if (codesErr) throw new Error(codesErr.message);

    const results: Array<{ code: string; email: string; status: string; detail?: string }> = [];

    for (const row of codes || []) {
      const email = String(row.owner_email).trim().toLowerCase();
      try {
        // Resolve or create the auth user for this partner.
        let userId: string | null = row.owner_user_id ?? null;
        if (!userId) {
          const { data: prof } = await admin
            .from("profiles")
            .select("id")
            .ilike("email", email)
            .maybeSingle();
          userId = prof?.id ?? null;
        }
        let isNew = false;
        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: row.owner_name || "", partner: true },
          });
          if (createErr || !created?.user) throw new Error(createErr?.message || "Could not create account");
          userId = created.user.id;
          isNew = true;
        }

        // Already signed in before? Mark activated and skip reminders.
        if (!isNew) {
          const { data: existing } = await admin.auth.admin.getUserById(userId);
          if (existing?.user?.last_sign_in_at) {
            await admin
              .from("discount_codes")
              .update({ owner_user_id: userId, portal_activated_at: existing.user.last_sign_in_at })
              .eq("id", row.id);
            if (mode === "remind") {
              results.push({ code: row.code, email, status: "skipped", detail: "Already active" });
              continue;
            }
          }
        }

        const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${SITE_URL}/reset-password` },
        });
        if (linkErr || !link?.properties?.action_link) {
          throw new Error(linkErr?.message || "Could not generate a password link");
        }

        const { error: sendErr } = await resend.emails.send({
          from: FROM,
          to: [email],
          subject: mode === "remind"
            ? "Reminder: set up your Maarifasasa Partner Portal login"
            : `You're approved — your ${row.code} partner code is live`,
          html: emailHtml({
            name: row.owner_name || "",
            code: row.code,
            percentOff: Number(row.percent_off || 0),
            actionLink: link.properties.action_link,
            reminder: mode === "remind",
          }),
        });
        if (sendErr) throw new Error(typeof sendErr === "string" ? sendErr : JSON.stringify(sendErr));

        await admin
          .from("discount_codes")
          .update({
            owner_user_id: userId,
            ...(mode === "remind"
              ? { portal_reminded_at: new Date().toISOString() }
              : { portal_invited_at: new Date().toISOString() }),
          })
          .eq("id", row.id);

        results.push({ code: row.code, email, status: "sent" });
      } catch (e) {
        console.error(`partner-invite failed for ${email}:`, e);
        results.push({ code: row.code, email, status: "failed", detail: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === "sent").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("partner-invite error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
