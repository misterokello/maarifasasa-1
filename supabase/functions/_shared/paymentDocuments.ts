// Shared helper that issues Maarifasasa-branded invoice + receipt PDFs for a
// successful payment, stores them in the private `payment-documents` bucket,
// records them in `public.payment_documents`, and (optionally) emails them to
// the learner as attachments via Resend.
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { LOGO_PNG_BASE64 } from "./brandLogo.ts";

const VIOLET = rgb(0.31, 0.271, 0.894); // #4F45E4
const GREEN = rgb(0.106, 0.655, 0.471); // #1BA778
const DARK = rgb(0.1, 0.1, 0.11);
const MUTED = rgb(0.45, 0.46, 0.48);
const LINE = rgb(0.9, 0.9, 0.92);
const PANEL = rgb(0.945, 0.968, 0.958); // #F1F7F5
const ROW = rgb(0.965, 0.965, 0.968);
const WHITE = rgb(1, 1, 1);

const COMPANY = {
  name: "Maarifasasa",
  legalName: "Maarifasasa Limited",
  tagline: "The future is now!",
  email: "hello@maarifasasa.com",
  phone: "+256 757 615 175",
  site: "maarifasasa.com",
  address: "Plot 26 Boundary Road, Lira City East",
};

export type DocType = "invoice" | "receipt";

export function formatMoney(amount: number, currency: string): string {
  if ((currency || "").toUpperCase() === "UGX") {
    return `UGX ${Math.round(amount).toLocaleString("en-US")}`;
  }
  return `$${(amount / 100).toFixed(2)}`;
}

function displayAmount(amount: number, currency: string): number {
  return (currency || "").toUpperCase() === "UGX" ? amount : amount / 100;
}

export function docNumber(type: DocType, payment: Record<string, any>): string {
  const year = new Date(payment.created_at || Date.now()).getUTCFullYear();
  const short = String(payment.id).replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MS-${type === "invoice" ? "INV" : "RCP"}-${year}-${short}`;
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function buildPdf(
  type: DocType,
  payment: Record<string, any>,
  product: Record<string, any> | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const M = 48;
  const RIGHT = width - M;

  const meta = payment.metadata || {};
  const currency = (payment.currency || "USD").toUpperCase();
  const gross = displayAmount(Number(payment.amount || 0), currency);
  const money = (v: number) =>
    currency === "UGX"
      ? `UGX ${Math.round(v).toLocaleString("en-US")}.00`
      : `$${v.toFixed(2)}`;

  const clip = (text: string, maxW: number, size: number, font = reg) => {
    let t = String(text);
    if (font.widthOfTextAtSize(t, size) <= maxW) return t;
    while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxW) t = t.slice(0, -1);
    return t + "…";
  };

  const drawR = (
    text: string,
    x: number,
    y: number,
    size: number,
    font = reg,
    color = DARK,
  ) => page.drawText(text, { x: x - font.widthOfTextAtSize(text, size), y, size, font, color });

  // ── Header: logo left, document identity right ──────────────────────────────
  try {
    const logo = await pdf.embedPng(b64ToBytes(LOGO_PNG_BASE64));
    const logoW = 168;
    const logoH = (logo.height / logo.width) * logoW;
    page.drawImage(logo, { x: M, y: height - 46 - logoH, width: logoW, height: logoH });
  } catch (_e) {
    page.drawText(COMPANY.name, { x: M, y: height - 76, size: 20, font: bold, color: DARK });
  }

  const title = type === "invoice" ? "INVOICE" : "RECEIPT";
  drawR(title, RIGHT, height - 68, 22, bold, DARK);
  drawR(COMPANY.name, RIGHT, height - 88, 11, reg, MUTED);
  const numLabel = `#${docNumber(type, payment)}`;
  drawR(numLabel, RIGHT, height - 106, 11, reg, GREEN);

  // Brand rule
  page.drawRectangle({ x: 0, y: height - 132, width, height: 3, color: VIOLET });

  // ── Party + details columns ────────────────────────────────────────────────
  let y = height - 172;
  const colRight = width / 2 + 10;
  page.drawText(type === "receipt" ? "RECEIVED FROM" : "BILLED TO", {
    x: M,
    y,
    size: 9,
    font: reg,
    color: MUTED,
  });
  page.drawText("DETAILS", { x: colRight, y, size: 9, font: reg, color: MUTED });
  y -= 20;

  const partyLines = [
    payment.payer_name || meta.customer_name || "Learner",
    payment.payer_email || "",
    payment.payer_phone || "",
  ].filter(Boolean);

  const details: [string, string][] = [
    [type === "invoice" ? "Invoice date" : "Receipt date", fmtDate(payment.completed_at || payment.created_at)],
    ["Invoice", `#${docNumber("invoice", payment)}`],
    ["Method", payment.payment_method === "mobile_money" ? "Mobile Money" : "Card"],
    ["Reference", String(payment.provider_reference || payment.external_id || "—").slice(0, 26)],
  ];

  const rows = Math.max(partyLines.length, details.length);
  for (let i = 0; i < rows; i++) {
    const ly = y - i * 22;
    if (partyLines[i]) {
      page.drawText(String(partyLines[i]).slice(0, 46), {
        x: M,
        y: ly,
        size: 10.5,
        font: reg,
        color: DARK,
      });
    }
    if (details[i]) {
      page.drawText(details[i][0], { x: colRight, y: ly, size: 10.5, font: reg, color: MUTED });
      drawR(details[i][1], RIGHT, ly, 10.5, reg, DARK);
    }
  }
  y -= rows * 22 + 34;

  // ── Amount panel ──────────────────────────────────────────────────────────
  const panelH = 74;
  page.drawRectangle({ x: M, y: y - panelH, width: width - M * 2, height: panelH, color: PANEL });
  page.drawText(type === "receipt" ? "AMOUNT RECEIVED" : "AMOUNT DUE", {
    x: M + 20,
    y: y - 28,
    size: 9.5,
    font: reg,
    color: MUTED,
  });
  drawR(money(gross), RIGHT - 20, y - 54, 22, bold, GREEN);
  y -= panelH + 36;

  // ── Line item table ───────────────────────────────────────────────────────
  const tableW = width - M * 2;
  const headers = type === "receipt"
    ? ["Applied to", "Invoice total", "Paid to date", "Balance"]
    : ["Description", "Category", "Method", "Amount"];
  const colX = [M + 12, M + tableW * 0.44, M + tableW * 0.64, M + tableW * 0.82];

  page.drawRectangle({ x: M, y: y - 26, width: tableW, height: 26, color: VIOLET });
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX[i], y: y - 17, size: 9.5, font: bold, color: WHITE });
  });
  y -= 26;

  const itemName = product?.name || meta.product_name || "Programme enrolment";
  const cells = type === "receipt"
    ? [
      `Invoice #${docNumber("invoice", payment)}`,
      money(gross),
      money(gross),
      money(0),
    ]
    : [
      String(itemName).slice(0, 42),
      String(product?.category || "Programme").slice(0, 18),
      payment.payment_method === "mobile_money" ? "Mobile Money" : "Card",
      money(gross),
    ];

  page.drawRectangle({ x: M, y: y - 28, width: tableW, height: 28, color: ROW });
  cells.forEach((c, i) => {
    if (i === cells.length - 1) {
      drawR(c, RIGHT - 12, y - 19, 9.5, reg, DARK);
    } else {
      const maxW = (i + 1 < colX.length ? colX[i + 1] : RIGHT) - colX[i] - 10;
      page.drawText(clip(c, maxW, 9.5), { x: colX[i], y: y - 19, size: 9.5, font: reg, color: DARK });
    }
  });
  y -= 28;

  if (meta.is_installment) {
    page.drawRectangle({ x: M, y: y - 24, width: tableW, height: 24, borderColor: LINE, borderWidth: 1 });
    page.drawText(
      `50% installment${meta.installment_number ? ` · payment ${meta.installment_number}` : ""}`,
      { x: colX[0], y: y - 16, size: 9, font: reg, color: MUTED },
    );
    y -= 24;
  }
  if (meta.discount_code) {
    page.drawRectangle({ x: M, y: y - 24, width: tableW, height: 24, borderColor: LINE, borderWidth: 1 });
    page.drawText(
      `Discount applied: ${meta.discount_code}${meta.discount_percent ? ` (-${meta.discount_percent}%)` : ""}`,
      { x: colX[0], y: y - 16, size: 9, font: reg, color: MUTED },
    );
    y -= 24;
  }

  y -= 32;
  page.drawText(
    type === "receipt"
      ? "This invoice is now settled in full. Thank you for your payment."
      : payment.status === "success"
      ? "This invoice has been settled in full. A receipt accompanies this document."
      : "Payment for this invoice is pending.",
    { x: M, y, size: 10.5, font: reg, color: DARK },
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = `${COMPANY.name} · ${type === "invoice" ? "Invoice" : "Receipt"} ${docNumber(type, payment)} · Generated ${new Date().toLocaleDateString("en-GB", { timeZone: "UTC" })}`;
  page.drawText(footer, { x: M, y: 56, size: 8.5, font: reg, color: MUTED });
  page.drawText(
    `${COMPANY.legalName} · ${COMPANY.address} · ${COMPANY.email} · ${COMPANY.site}`,
    { x: M, y: 42, size: 8.5, font: reg, color: MUTED },
  );

  return await pdf.save();
}


function b64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export interface IssuedDoc {
  doc_type: DocType;
  doc_number: string;
  storage_path: string;
  bytes?: Uint8Array;
}

/**
 * Idempotently generate + store the invoice and receipt for a payment.
 * Returns the document rows. Existing documents are reused (not regenerated).
 */
export async function issuePaymentDocuments(
  supabase: any,
  paymentId: string,
  opts: { sendEmail?: boolean; resendApiKey?: string; from?: string } = {},
): Promise<{ documents: IssuedDoc[]; emailed: boolean }> {
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*, products(name, category)")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !payment) throw new Error("Payment not found");
  if (payment.status !== "success") throw new Error("Payment is not successful");

  const product = payment.products || null;

  const { data: existing } = await supabase
    .from("payment_documents")
    .select("*")
    .eq("payment_id", paymentId);

  const existingMap = new Map<string, any>((existing || []).map((d: any) => [d.doc_type, d]));
  const documents: IssuedDoc[] = [];
  const attachments: { filename: string; content: string }[] = [];

  for (const type of ["invoice", "receipt"] as DocType[]) {
    const row = existingMap.get(type);
    const number = row?.doc_number || docNumber(type, payment);
    const path = `${paymentId}/${number}.pdf`;
    let bytes: Uint8Array | undefined;

    if (row?.storage_path) {
      const { data: file } = await supabase.storage
        .from("payment-documents")
        .download(row.storage_path);
      if (file) bytes = new Uint8Array(await file.arrayBuffer());
    }

    if (!bytes) {
      const attempts = Number(row?.generation_attempts || 0) + 1;
      try {
        bytes = await buildPdf(type, payment, product);
        const up = await supabase.storage
          .from("payment-documents")
          .upload(path, bytes, { contentType: "application/pdf", upsert: true });
        if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

        await supabase.from("payment_documents").upsert(
          {
            payment_id: paymentId,
            doc_type: type,
            doc_number: number,
            storage_path: path,
            amount: payment.amount,
            currency: payment.currency,
            generation_attempts: attempts,
            last_attempt_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "payment_id,doc_type" },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[payment-documents] ${type} generation failed:`, message);
        // Record the failed attempt so it is auditable instead of silently missing.
        await supabase.from("payment_documents").upsert(
          {
            payment_id: paymentId,
            doc_type: type,
            doc_number: number,
            storage_path: row?.storage_path ?? null,
            amount: payment.amount,
            currency: payment.currency,
            generation_attempts: attempts,
            last_attempt_at: new Date().toISOString(),
            last_error: message.slice(0, 1000),
          },
          { onConflict: "payment_id,doc_type" },
        );
        throw err;
      }
    }

    documents.push({ doc_type: type, doc_number: number, storage_path: row?.storage_path || path, bytes });
    attachments.push({ filename: `${number}.pdf`, content: b64(bytes) });
  }

  let emailed = false;
  const to = payment.payer_email;
  const alreadyEmailed = (existing || []).some((d: any) => d.emailed_at);

  if (opts.sendEmail && to && opts.resendApiKey && !alreadyEmailed) {
    const currency = (payment.currency || "USD").toUpperCase();
    const total = formatMoney(Number(payment.amount || 0), currency);
    const invoiceNo = documents.find((d) => d.doc_type === "invoice")!.doc_number;
    const receiptNo = documents.find((d) => d.doc_type === "receipt")!.doc_number;
    const name = payment.payer_name || "there";
    const productName = product?.name || payment.metadata?.product_name || "your programme";

    const html = `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Tahoma,sans-serif;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
      <div style="background:linear-gradient(135deg,#4F45E4,#6C63FF);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Your invoice &amp; receipt</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:14px;">${escapeHtml(productName)}</p>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;">
        <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p style="color:#555;">Thank you for your payment. Your Maarifasasa invoice and receipt are attached as PDFs. You can also download them any time from your dashboard under <strong>Payments</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#FAFAFA;border-radius:8px;">
          <tr><td style="padding:10px 14px;color:#777;font-size:14px;">Invoice no.</td><td style="padding:10px 14px;text-align:right;font-weight:600;">${escapeHtml(invoiceNo)}</td></tr>
          <tr><td style="padding:10px 14px;color:#777;font-size:14px;">Receipt no.</td><td style="padding:10px 14px;text-align:right;font-weight:600;">${escapeHtml(receiptNo)}</td></tr>
          <tr><td style="padding:10px 14px;color:#777;font-size:14px;">Amount paid</td><td style="padding:10px 14px;text-align:right;font-weight:600;">${escapeHtml(total)}</td></tr>
        </table>
        <p style="color:#777;font-size:13px;">Keep these documents for your records.</p>
        <p style="color:#777;font-size:13px;margin-bottom:0;">— The Maarifasasa Team</p>
      </div>
    </body></html>`;

    const emailAttempts = Math.max(
      ...(existing || []).map((d: any) => Number(d.email_attempts || 0)),
      0,
    ) + 1;

    let emailError: string | null = null;
    let messageId: string | null = null;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: opts.from || "Maarifasasa <noreply@maarifasasa.com>",
          to: [to],
          subject: `Your Maarifasasa invoice & receipt (${receiptNo})`,
          html,
          attachments,
        }),
      });

      if (res.ok) {
        emailed = true;
        try {
          const payload = await res.json();
          messageId = payload?.id ?? null;
        } catch {
          /* body is optional */
        }
      } else {
        emailError = (await res.text()).slice(0, 1000);
        console.error("[payment-documents] Resend error:", emailError);
      }
    } catch (err) {
      emailError = (err instanceof Error ? err.message : String(err)).slice(0, 1000);
      console.error("[payment-documents] Resend request failed:", emailError);
    }

    await supabase
      .from("payment_documents")
      .update({
        emailed_at: emailed ? new Date().toISOString() : null,
        email_status: emailed ? "sent" : "failed",
        email_attempts: emailAttempts,
        email_error: emailError,
        email_message_id: messageId,
        email_to: to,
      })
      .eq("payment_id", paymentId);
  }


  return { documents: documents.map(({ bytes: _b, ...d }) => d as IssuedDoc), emailed };
}

function escapeHtml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
