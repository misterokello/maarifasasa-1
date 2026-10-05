import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Loader2, RefreshCw, Send } from "lucide-react";
import {
  docState,
  emailState,
  learnerLabel,
  STATE_LABEL,
  STATE_TONE,
  type AuditRow,
} from "./paymentAuditTypes";

const dt = (value?: string | null) =>
  value ? format(new Date(value), "dd MMM yyyy, HH:mm") : "—";

interface Props {
  row: AuditRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const StateBadge = ({ state }: { state: string }) => (
  <Badge variant="outline" className={STATE_TONE[state]}>
    {STATE_LABEL[state] ?? state}
  </Badge>
);

const PaymentAuditDetailSheet = ({ row, open, onOpenChange, onChanged }: Props) => {
  const [busy, setBusy] = useState<string | null>(null);

  if (!row) return null;

  const invoice = row.payment_documents?.find((d) => d.doc_type === "invoice");
  const receipt = row.payment_documents?.find((d) => d.doc_type === "receipt");

  const download = async (docType: "invoice" | "receipt") => {
    setBusy(docType);
    try {
      const { data, error } = await supabase.functions.invoke("payment-documents", {
        body: { action: "url", payment_id: row.id, doc_type: docType },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || "Document unavailable");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(`Could not open ${docType}`, {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const reissue = async (resend: boolean) => {
    setBusy(resend ? "resend" : "reissue");
    try {
      const { data, error } = await supabase.functions.invoke("payment-documents", {
        body: { action: "issue", payment_id: row.id, resend },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(resend ? "Documents re-issued and email sent" : "Documents re-issued");
      onChanged();
    } catch (err) {
      toast.error("Action failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const timeline: { label: string; at: string | null; note?: string | null }[] = [
    { label: "Payment created", at: row.created_at },
    { label: "Payment completed", at: row.completed_at },
    { label: "Invoice generated", at: invoice?.issued_at ?? null, note: invoice?.last_error },
    { label: "Receipt generated", at: receipt?.issued_at ?? null, note: receipt?.last_error },
    {
      label: "Documents emailed",
      at: invoice?.emailed_at ?? receipt?.emailed_at ?? null,
      note: invoice?.email_error ?? receipt?.email_error,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate">{learnerLabel(row)}</SheetTitle>
          <SheetDescription className="truncate">
            {row.payer_email || "No email on record"} · {row.products?.name || "Unknown product"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">
                {(row.currency || "").toUpperCase()} {Number(row.amount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment status</p>
              <p className="font-semibold capitalize">{row.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="font-medium">
                {row.payment_method === "stripe" ? "Card (Stripe)" : "Mobile money"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reference</p>
              <p className="font-mono text-xs break-all">
                {row.provider_reference || row.external_id || "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="font-semibold">Document generation</p>
            {(["invoice", "receipt"] as const).map((type) => {
              const doc = type === "invoice" ? invoice : receipt;
              return (
                <div key={type} className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium capitalize">{type}</span>
                    <StateBadge state={docState(row, type)} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {doc?.doc_number ? `No. ${doc.doc_number} · ` : ""}
                    {doc?.generation_attempts ? `${doc.generation_attempts} attempt(s)` : "No attempts recorded"}
                    {doc?.last_attempt_at ? ` · last ${dt(doc.last_attempt_at)}` : ""}
                  </p>
                  {doc?.last_error && (
                    <p className="text-xs text-destructive break-words">{doc.last_error}</p>
                  )}
                  {doc?.storage_path && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      disabled={busy === type}
                      onClick={() => download(type)}
                    >
                      {busy === type ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Download
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Email delivery</p>
              <StateBadge state={emailState(row)} />
            </div>
            <p className="text-xs text-muted-foreground break-all">
              To {invoice?.email_to || row.payer_email || "—"} ·{" "}
              {invoice?.email_attempts || receipt?.email_attempts || 0} attempt(s)
            </p>
            {(invoice?.email_message_id || receipt?.email_message_id) && (
              <p className="text-xs text-muted-foreground break-all">
                Provider id: {invoice?.email_message_id || receipt?.email_message_id}
              </p>
            )}
            {(invoice?.email_error || receipt?.email_error) && (
              <p className="text-xs text-destructive break-words">
                {invoice?.email_error || receipt?.email_error}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-semibold">Timeline</p>
            <ol className="space-y-2">
              {timeline.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.at ? "bg-emerald-500" : item.note ? "bg-destructive" : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{dt(item.at)}</p>
                    {!item.at && item.note && (
                      <p className="text-xs text-destructive break-words">{item.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {row.status === "success" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy === "reissue"}
                onClick={() => reissue(false)}
              >
                {busy === "reissue" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                Re-issue documents
              </Button>
              <Button
                className="flex-1"
                disabled={busy === "resend" || !row.payer_email}
                onClick={() => reissue(true)}
              >
                {busy === "resend" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                Re-send email
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentAuditDetailSheet;
