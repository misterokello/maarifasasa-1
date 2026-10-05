import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serviceClient } from "../_shared/engagement-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const MAX_SKEW_MS = 5 * 60 * 1000; // 5 minutes

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  rawBody: string,
): Promise<boolean> {
  // Replay protection
  const tsMs = Number(svixTimestamp) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_SKEW_MS) return false;

  // Secret format: "whsec_<base64>"
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = base64ToBytes(rawSecret);
  } catch {
    keyBytes = new TextEncoder().encode(rawSecret);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload)),
  );
  const expected = bytesToBase64(sigBytes);

  // Header may contain multiple space-separated "v1,<sig>" entries
  const candidates = svixSignature.split(" ").map((p) => p.trim()).filter(Boolean);
  for (const c of candidates) {
    const [version, sig] = c.split(",");
    if (version === "v1" && sig && timingSafeEqual(sig, expected)) return true;
  }
  return false;
}

// Resend webhook event types: email.sent, email.delivered, email.opened,
// email.clicked, email.bounced, email.complained, email.delivery_delayed

const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

const COUNT_COLUMN: Record<string, string> = {
  "email.delivered": "delivered_count",
  "email.opened": "opened_count",
  "email.clicked": "clicked_count",
  "email.bounced": "bounced_count",
  "email.complained": "complained_count",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Fail closed: webhook secret must be configured.
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(JSON.stringify({ error: "Missing signature headers" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const valid = await verifySvixSignature(secret, svixId, svixTimestamp, svixSignature, rawBody);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const type: string = event?.type ?? "";
  const data = event?.data ?? {};
  const resendId: string | undefined = data?.email_id || data?.id;
  const email: string | undefined = Array.isArray(data?.to) ? data.to[0] : data?.to;

  if (!type || (!resendId && !email)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = serviceClient();
  let recipient: any = null;
  if (resendId) {
    const { data: r } = await sb
      .from("email_campaign_recipients")
      .select("id, campaign_id, status, open_count, click_count")
      .eq("resend_id", resendId)
      .maybeSingle();
    recipient = r;
  }

  if (recipient) {
    const update: Record<string, any> = {};
    const nowIso = new Date().toISOString();
    if (type === "email.delivered") { update.status = "delivered"; update.delivered_at = nowIso; }
    if (type === "email.opened") { update.status = "opened"; update.opened_at = nowIso; update.open_count = (recipient.open_count || 0) + 1; }
    if (type === "email.clicked") { update.status = "clicked"; update.clicked_at = nowIso; update.click_count = (recipient.click_count || 0) + 1; }
    if (type === "email.bounced") {
      update.status = "bounced"; update.bounced_at = nowIso;
      update.bounce_type = data?.bounce?.type ?? null;
      update.error_message = data?.bounce?.message ?? null;
    }
    if (type === "email.complained") { update.status = "complained"; }

    if (Object.keys(update).length > 0) {
      await sb.from("email_campaign_recipients").update(update).eq("id", recipient.id);
    }

    // Increment campaign aggregate counters
    const col = COUNT_COLUMN[type];
    if (col && recipient.campaign_id) {
      const { data: camp } = await sb.from("email_campaigns").select(col).eq("id", recipient.campaign_id).single();
      const current = (camp as any)?.[col] ?? 0;
      await sb.from("email_campaigns").update({ [col]: current + 1 }).eq("id", recipient.campaign_id);
    }

    await sb.from("email_campaign_events").insert({
      campaign_id: recipient.campaign_id,
      recipient_id: recipient.id,
      recipient_email: email ?? null,
      event_type: type,
      payload: data,
    });
  } else {
    // Log unmatched event for diagnostics
    await sb.from("email_campaign_events").insert({
      campaign_id: null,
      recipient_id: null,
      recipient_email: email ?? null,
      event_type: type,
      payload: data,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});