// Thinkific sync worker — drains public.thinkific_sync_queue.
//
// Called two ways:
//   1. Fire-and-forget from webhooks with { queue_id } for a single item
//      (fast path so the learner gets access immediately on payment).
//   2. Cron every 5 minutes with { drain: true } to catch retries and
//      any rows the webhook kick missed.
//
// Auth: internal shared secret (webhooks) OR CRON_SECRET (pg_cron). No
// user-facing surface — service role only.
//
// Each queue row leads to:
//   - calling `thinkific-enrollment` to find/create the Thinkific user and
//     enroll them in the course,
//   - writing back thinkific_user_id/thinkific_enrollment_id + status
//     onto public.enrollments and public.profiles,
//   - sending the "your course access is ready" email once per enrollment,
//   - marking the queue row processed / failed with exponential backoff.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const MAX_BATCH = 25;
const THINKIFIC_SUBDOMAIN = "maarifasasa";
const THINKIFIC_SIGNIN_URL = `https://${THINKIFIC_SUBDOMAIN}.thinkific.com/users/sign_in`;

function backoffMinutes(attempts: number): number {
  // 1, 2, 4, 8, 16, 32, 64, 128 minutes — capped by max_attempts on row.
  return Math.min(2 ** Math.max(0, attempts - 1), 240);
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAuthorized(req: Request): boolean {
  const internal = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
  const cron = Deno.env.get("CRON_SECRET") ?? "";
  const provided = req.headers.get("x-internal-secret") ?? req.headers.get("x-cron-secret") ?? "";
  if (internal && provided && constantTimeEq(internal, provided)) return true;
  if (cron && provided && constantTimeEq(cron, provided)) return true;
  return false;
}

interface QueueRow {
  id: string;
  kind: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  related_enrollment_id: string | null;
  related_user_id: string | null;
}

async function claimRows(supabase: any, queueId: string | null): Promise<QueueRow[]> {
  const nowIso = new Date().toISOString();
  const query = supabase
    .from("thinkific_sync_queue")
    .select("id, kind, payload, attempts, max_attempts, related_enrollment_id, related_user_id")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(queueId ? 1 : MAX_BATCH);
  if (queueId) query.eq("id", queueId);
  const { data, error } = await query;
  if (error) {
    console.error("[thinkific-sync] claim query failed:", error);
    return [];
  }
  if (!data?.length) return [];

  // Mark as processing to reduce concurrent double-work (best-effort — the
  // status column will be flipped again on success/failure).
  const ids = data.map((r: QueueRow) => r.id);
  await supabase
    .from("thinkific_sync_queue")
    .update({ status: "processing" })
    .in("id", ids);
  return data as QueueRow[];
}

async function callThinkificEnrollment(payload: Record<string, any>) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const fullName = (payload.full_name || "").toString().trim();
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || (payload.email as string).split("@")[0];
  const lastName = parts.slice(1).join(" ") || "";

  const res = await fetch(`${supabaseUrl}/functions/v1/thinkific-enrollment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "",
    },
    body: JSON.stringify({
      email: payload.email,
      first_name: firstName,
      last_name: lastName,
      course_id: payload.course_id,
      payment_id: payload.payment_id,
      phone: payload.phone ?? undefined,
      country: payload.country ?? undefined,
    }),
  });
  const text = await res.text();
  let json: Record<string, any> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* keep text */ }
  if (!res.ok) {
    throw new Error(`thinkific-enrollment ${res.status}: ${text}`);
  }
  return json;
}

async function sendAccessReadyEmail(
  resend: InstanceType<typeof Resend> | null,
  args: {
    email: string;
    fullName: string;
    productName: string;
    expressSignInUrl?: string;
    isNewUser?: boolean;
  },
) {
  if (!resend || !args.email) return;
  const signInUrl = args.expressSignInUrl || THINKIFIC_SIGNIN_URL;
  const newUserNote = args.isNewUser
    ? `<p style="margin:12px 0 0;font-size:13px;color:#1b5e20;">📧 We've also sent a password-setup email so you can secure your account.</p>`
    : "";
  try {
    await resend.emails.send({
      from: "Maarifasasa <noreply@maarifasasa.com>",
      to: [args.email],
      subject: `Your course access is ready — ${args.productName}`,
      html: `<!doctype html><html><body style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:24px;border-radius:10px 10px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">🎓 You're enrolled!</h1>
  </div>
  <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;">
    <p>Hi ${args.fullName || "there"},</p>
    <p>Your access to <strong>${args.productName}</strong> is now active. Click below to jump straight into your learning dashboard — no password required for this link.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${signInUrl}" style="display:inline-block;background:#1565c0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Open my course</a>
    </p>
    ${newUserNote}
    <p style="font-size:13px;color:#666;margin-top:24px;">Need help? Email <a href="mailto:info@maarifasasa.com">info@maarifasasa.com</a>.</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("[thinkific-sync] access-ready email failed:", err);
  }
}

async function processEnroll(supabase: any, resend: any, row: QueueRow): Promise<void> {
  const payload = row.payload || {};
  const result = await callThinkificEnrollment(payload);

  const thinkificUserId = Number(result.user_id) || null;
  const thinkificEnrollmentId = Number(result.enrollment_id) || null;
  const expressSignInUrl = result.express_sign_in_url as string | undefined;
  const isNewUser = Boolean(result.is_new_user);

  // Update enrollment row (if we have one)
  if (row.related_enrollment_id) {
    await supabase
      .from("enrollments")
      .update({
        status: "active",
        thinkific_enrollment_id: thinkificEnrollmentId,
        activated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", row.related_enrollment_id);
  }

  // Update profile with Thinkific user id
  if (row.related_user_id && thinkificUserId) {
    await supabase
      .from("profiles")
      .update({
        thinkific_user_id: thinkificUserId,
        thinkific_synced_at: new Date().toISOString(),
      })
      .eq("id", row.related_user_id);
  }

  // Look up product name for email
  let productName = "your course";
  let payerName = "";
  let payerEmail = payload.email as string;
  if (payload.payment_id) {
    const { data: paymentRow } = await supabase
      .from("payments")
      .select("payer_name, payer_email, products(name)")
      .eq("id", payload.payment_id)
      .maybeSingle();
    if (paymentRow) {
      productName = paymentRow.products?.name || productName;
      payerName = paymentRow.payer_name || "";
      payerEmail = paymentRow.payer_email || payerEmail;
    }
  }

  // Send the "access ready" email once per enrollment
  if (row.related_enrollment_id) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("metadata")
      .eq("id", row.related_enrollment_id)
      .maybeSingle();
    const already = enrollment?.metadata?.access_email_sent_at;
    if (!already) {
      await sendAccessReadyEmail(resend, {
        email: payerEmail,
        fullName: payerName,
        productName,
        expressSignInUrl,
        isNewUser,
      });
      await supabase
        .from("enrollments")
        .update({
          metadata: {
            ...(enrollment?.metadata || {}),
            access_email_sent_at: new Date().toISOString(),
            thinkific_user_id: thinkificUserId,
            express_sign_in_url: expressSignInUrl,
          },
        })
        .eq("id", row.related_enrollment_id);
    }
  }
}

async function markSuccess(supabase: any, id: string) {
  await supabase
    .from("thinkific_sync_queue")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", id);
}

async function markFailure(supabase: any, row: QueueRow, error: string) {
  const nextAttempts = row.attempts + 1;
  const done = nextAttempts >= row.max_attempts;
  const next = new Date(Date.now() + backoffMinutes(nextAttempts) * 60_000).toISOString();
  await supabase
    .from("thinkific_sync_queue")
    .update({
      status: done ? "failed" : "pending",
      attempts: nextAttempts,
      last_error: error.slice(0, 2000),
      next_attempt_at: next,
    })
    .eq("id", row.id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resend = resendKey ? new Resend(resendKey) : null;

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const queueId = body.queue_id as string | undefined;

  const rows = await claimRows(supabase, queueId ?? null);
  console.log(`[thinkific-sync] claimed ${rows.length} row(s)`);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const row of rows) {
    try {
      if (row.kind === "enroll") {
        await processEnroll(supabase, resend, row);
      } else {
        throw new Error(`unknown kind: ${row.kind}`);
      }
      await markSuccess(supabase, row.id);
      results.push({ id: row.id, ok: true });
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`[thinkific-sync] row ${row.id} failed:`, msg);
      await markFailure(supabase, row, msg);
      results.push({ id: row.id, ok: false, error: msg });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});