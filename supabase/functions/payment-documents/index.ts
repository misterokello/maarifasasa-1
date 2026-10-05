// Issues / serves Maarifasasa invoice + receipt PDFs for successful payments.
//
// Actions:
//   { action: "issue", payment_id }  -> generate (idempotent) + optionally email
//   { action: "url", payment_id, doc_type } -> short-lived signed download URL
//
// Callable by:
//   - internal server code with the x-internal-secret header (emails the learner)
//   - the authenticated learner who owns the payment, or a payments/super admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { issuePaymentDocuments } from "../_shared/paymentDocuments.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "issue";
    const paymentId = body.payment_id;

    if (typeof paymentId !== "string" || !/^[0-9a-f-]{36}$/i.test(paymentId)) {
      return json({ error: "Invalid payment_id" }, 400);
    }

    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const isInternal =
      !!internalSecret && req.headers.get("x-internal-secret") === internalSecret;

    let allowed = isInternal;
    let requesterEmail: string | null = null;
    let isPaymentsAdmin = false;

    if (!allowed) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);

      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      const user = userData?.user;
      if (userErr || !user) return json({ error: "Unauthorized" }, 401);
      requesterEmail = (user.email || "").trim().toLowerCase();

      const { data: payment } = await admin
        .from("payments")
        .select("user_id, payer_email")
        .eq("id", paymentId)
        .maybeSingle();

      if (!payment) return json({ error: "Payment not found" }, 404);

      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      isPaymentsAdmin = (roles || []).some((r: any) =>
        ["admin", "payments_admin"].includes(r.role)
      );

      const owns =
        payment.user_id === user.id ||
        (!!payment.payer_email &&
          payment.payer_email.trim().toLowerCase() === requesterEmail);

      if (!owns && !isPaymentsAdmin) return json({ error: "Forbidden" }, 403);
      allowed = true;
    }

    if (action === "url") {
      const docType = body.doc_type === "invoice" ? "invoice" : "receipt";
      let { data: doc } = await admin
        .from("payment_documents")
        .select("storage_path, doc_number")
        .eq("payment_id", paymentId)
        .eq("doc_type", docType)
        .maybeSingle();

      if (!doc?.storage_path) {
        // Generate on demand (covers payments made before this feature shipped,
        // and earlier attempts that failed before a file was stored).
        await issuePaymentDocuments(admin, paymentId, { sendEmail: false });
        const retry = await admin
          .from("payment_documents")
          .select("storage_path, doc_number")
          .eq("payment_id", paymentId)
          .eq("doc_type", docType)
          .maybeSingle();
        doc = retry.data;
      }

      if (!doc?.storage_path) return json({ error: "Document unavailable" }, 404);

      const { data: signed, error: signErr } = await admin.storage
        .from("payment-documents")
        .createSignedUrl(doc.storage_path, 600, { download: `${doc.doc_number}.pdf` });

      if (signErr || !signed) return json({ error: "Could not create link" }, 500);

      return json({ url: signed.signedUrl, doc_number: doc.doc_number });
    }

    // action: issue — admins may explicitly force a re-send from the audit page.
    const forceResend = body.resend === true && (isInternal || isPaymentsAdmin);
    if (forceResend) {
      await admin
        .from("payment_documents")
        .update({ emailed_at: null })
        .eq("payment_id", paymentId);
    }

    const result = await issuePaymentDocuments(admin, paymentId, {
      sendEmail: body.send_email !== false && (isInternal || (isPaymentsAdmin && forceResend)),
      resendApiKey: Deno.env.get("RESEND_API_KEY") || undefined,
    });

    return json({ success: true, ...result });

  } catch (err) {
    console.error("[payment-documents] error:", err);
    return json({ error: (err as Error).message || "Internal server error" }, 500);
  }
});
