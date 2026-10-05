/**
 * Partner (referral code owner) email notifications.
 * Sends on: new signup, course payment, commission earned, commission paid.
 */
import { Resend } from "npm:resend@2.0.0";

const FROM = "Maarifasasa Partners <partners@maarifasasa.com>";
const PORTAL_URL = "https://maarifasasa.com/partners/portal";

export type PartnerEvent = "signup" | "payment" | "commission_earned" | "commission_paid";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number, currency: string) {
  return currency === "UGX"
    ? `UGX ${Number(amount).toLocaleString()}`
    : `$${Number(amount).toLocaleString()}`;
}

function shell(title: string, bodyHtml: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <h2 style="font-size:20px;margin:0 0 16px">${esc(title)}</h2>
    ${bodyHtml}
    <p style="margin-top:24px">
      <a href="${PORTAL_URL}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open partner portal</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:24px">Maarifasasa — Knowledge Now. Opportunity Everywhere.</p>
  </div>`;
}

interface NotifyParams {
  event: PartnerEvent;
  code: string;
  personName?: string | null;
  productName?: string | null;
  currency?: string;
  amount?: number | null;
  commissionAmount?: number | null;
}

function build(p: NotifyParams): { subject: string; html: string } {
  const who = p.personName?.trim() || "Someone";
  switch (p.event) {
    case "signup":
      return {
        subject: `New signup via your code ${p.code}`,
        html: shell("You have a new signup 🎉", `<p>${esc(who)} just created an account using your referral link (<strong>${esc(p.code)}</strong>).</p>`),
      };
    case "payment":
      return {
        subject: `A course was paid for with your code ${p.code}`,
        html: shell("A referral just paid for a course 💳", `<p>${esc(who)} paid for <strong>${esc(p.productName || "a course")}</strong>${
          p.amount ? ` (${esc(money(p.amount, p.currency || "UGX"))})` : ""
        } using your code <strong>${esc(p.code)}</strong>.</p>`),
      };
    case "commission_earned":
      return {
        subject: `You earned a commission of ${money(p.commissionAmount || 0, p.currency || "UGX")}`,
        html: shell("You earned a commission 💰", `<p>Your code <strong>${esc(p.code)}</strong> earned <strong>${esc(
          money(p.commissionAmount || 0, p.currency || "UGX"),
        )}</strong>${p.productName ? ` on ${esc(p.productName)}` : ""}.</p><p>The commission is now pending review by our team.</p>`),
      };
    case "commission_paid":
      return {
        subject: `Your commission of ${money(p.commissionAmount || 0, p.currency || "UGX")} has been paid`,
        html: shell("Your commission has been paid ✅", `<p>We've paid out <strong>${esc(
          money(p.commissionAmount || 0, p.currency || "UGX"),
        )}</strong> for your referral${p.productName ? ` on ${esc(p.productName)}` : ""} (code <strong>${esc(p.code)}</strong>).</p>`),
      };
  }
}

/** Resolve the partner's email for a code and send the event email. Never throws. */
export async function notifyPartner(
  supabase: any,
  discountCodeId: string,
  params: Omit<NotifyParams, "code"> & { code?: string },
): Promise<void> {
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return;

    const { data: code } = await supabase
      .from("discount_codes")
      .select("code, owner_email, owner_user_id, owner_name")
      .eq("id", discountCodeId)
      .maybeSingle();
    if (!code) return;

    let to = code.owner_email as string | null;
    if (!to && code.owner_user_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", code.owner_user_id)
        .maybeSingle();
      to = prof?.email || null;
    }
    if (!to) return;

    const { subject, html } = build({ ...params, code: params.code || code.code });
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
    if (error) console.error("[partner-notify] send error", error);
  } catch (err) {
    console.error("[partner-notify] failed", err);
  }
}
