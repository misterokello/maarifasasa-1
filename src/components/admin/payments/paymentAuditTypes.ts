/**
 * Shared types + helpers for the admin Payments Audit view.
 *
 * A row combines the payment record with its invoice/receipt document rows so
 * admins can see, per learner, whether documents were generated and emailed.
 */
export type DocRow = {
  doc_type: "invoice" | "receipt";
  doc_number: string | null;
  storage_path: string | null;
  issued_at: string | null;
  emailed_at: string | null;
  generation_attempts: number | null;
  last_attempt_at: string | null;
  last_error: string | null;
  email_status: string | null;
  email_attempts: number | null;
  email_error: string | null;
  email_message_id: string | null;
  email_to: string | null;
};

export type AuditRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  provider_reference: string | null;
  external_id: string | null;
  payer_name: string | null;
  payer_email: string | null;
  created_at: string;
  completed_at: string | null;
  products: { name: string; category: string } | null;
  payment_documents: DocRow[];
};

export type DocState = "issued" | "pending" | "failed" | "n/a";

export const docState = (row: AuditRow, type: "invoice" | "receipt"): DocState => {
  if (row.status !== "success") return "n/a";
  const doc = row.payment_documents?.find((d) => d.doc_type === type);
  if (doc?.storage_path) return "issued";
  if (doc?.last_error) return "failed";
  return "pending";
};

export type EmailState = "sent" | "failed" | "not_attempted" | "n/a";

export const emailState = (row: AuditRow): EmailState => {
  if (row.status !== "success") return "n/a";
  const docs = row.payment_documents || [];
  if (docs.some((d) => d.emailed_at || d.email_status === "sent")) return "sent";
  if (docs.some((d) => d.email_status === "failed")) return "failed";
  return "not_attempted";
};

export const firstError = (row: AuditRow): string | null =>
  row.payment_documents?.find((d) => d.last_error)?.last_error ?? null;

export const firstEmailError = (row: AuditRow): string | null =>
  row.payment_documents?.find((d) => d.email_error)?.email_error ?? null;

export const learnerLabel = (row: AuditRow) =>
  row.payer_name || row.payer_email || "Unknown learner";

export const STATE_LABEL: Record<string, string> = {
  issued: "Issued",
  pending: "Pending",
  failed: "Failed",
  sent: "Sent",
  not_attempted: "Not sent",
  "n/a": "—",
};

export const STATE_TONE: Record<string, string> = {
  issued: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  not_attempted: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  "n/a": "bg-muted text-muted-foreground border-border",
};
