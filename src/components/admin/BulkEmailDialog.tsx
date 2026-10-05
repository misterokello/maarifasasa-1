import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mail, AlertTriangle, FlaskConical, CheckCircle2, XCircle, Clock, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BulkRecipient {
  email: string;
  name?: string | null;
}

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: BulkRecipient[];
  /** Short label describing the audience, e.g. "all academy users" or course name. */
  audienceLabel: string;
}

const BATCH_SIZE = 40;

type DeliveryStatus = "queued" | "sent" | "failed";

interface DeliveryRow {
  email: string;
  name?: string | null;
  status: DeliveryStatus;
  error?: string;
  logId?: string;
}

interface AuditEntry {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  test_mode: boolean;
  sender_email: string | null;
  audience_label: string | null;
  created_at: string;
  sent_at: string | null;
}

const BulkEmailDialog: React.FC<BulkEmailDialogProps> = ({
  open,
  onOpenChange,
  recipients,
  audienceLabel,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [personalize, setPersonalize] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("bulk_email_log")
      .select("id, recipient_email, recipient_name, subject, status, error_message, test_mode, sender_email, audience_label, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setHistory(data as AuditEntry[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (showHistory && history.length === 0) loadHistory();
  }, [showHistory]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminEmail(data.user?.email ?? null);
      setAdminId(data.user?.id ?? null);
    });
  }, []);

  // Live updates: realtime subscription on bulk_email_log scoped to this batch,
  // plus a polling fallback in case realtime is delayed/unavailable.
  useEffect(() => {
    if (!batchId || !sending) return;

    const applyRow = (row: any) => {
      if (!row?.recipient_email) return;
      setDeliveries((prev) =>
        prev.map((d) =>
          d.email === row.recipient_email
            ? {
                ...d,
                status: (row.status as DeliveryStatus) ?? d.status,
                error: row.error_message ?? d.error,
                logId: row.id ?? d.logId,
              }
            : d
        )
      );
      setLastUpdateAt(Date.now());
    };

    const channel = supabase
      .channel(`bulk_email_log:${batchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bulk_email_log",
          filter: `batch_id=eq.${batchId}`,
        },
        (payload) => applyRow(payload.new ?? payload.old)
      )
      .subscribe();

    // Polling fallback every 2s while sending
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("bulk_email_log")
        .select("id, recipient_email, status, error_message")
        .eq("batch_id", batchId);
      if (data) data.forEach(applyRow);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [batchId, sending]);

  const validRecipients = useMemo(() => {
    const seen = new Set<string>();
    return recipients
      .filter((r) => r.email && /.+@.+\..+/.test(r.email))
      .filter((r) => {
        const key = r.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [recipients]);

  const effectiveRecipients = useMemo<BulkRecipient[]>(() => {
    if (testMode) {
      return adminEmail ? [{ email: adminEmail, name: "Test recipient" }] : [];
    }
    return validRecipients;
  }, [testMode, adminEmail, validRecipients]);

  const sentCount = deliveries.filter((d) => d.status === "sent").length;
  const failedCount = deliveries.filter((d) => d.status === "failed").length;
  const queuedCount = deliveries.filter((d) => d.status === "queued").length;

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter a subject and message");
      return;
    }
    if (effectiveRecipients.length === 0) {
      toast.error("No valid recipients");
      return;
    }
    if (testMode && !adminEmail) {
      toast.error("Could not determine your email for test mode");
      return;
    }

    const confirmed = window.confirm(
      testMode
        ? `Send a TEST email to ${adminEmail}?`
        : `Send this email to ${effectiveRecipients.length} recipient${effectiveRecipients.length === 1 ? "" : "s"}?`
    );
    if (!confirmed) return;

    setSending(true);
    const thisBatchId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    setBatchId(thisBatchId);
    setLastUpdateAt(Date.now());

    // Initialize delivery rows + insert audit log entries (status=queued)
    const initial: DeliveryRow[] = effectiveRecipients.map((r) => ({
      email: r.email,
      name: r.name ?? null,
      status: "queued",
    }));
    setDeliveries(initial);

    // Insert audit log rows (one per recipient) so we have a logId to update.
    const logRows = effectiveRecipients.map((r) => ({
      sender_id: adminId,
      sender_email: adminEmail,
      audience_label: testMode ? `TEST (${audienceLabel})` : audienceLabel,
      subject,
      recipient_email: r.email,
      recipient_name: r.name ?? null,
      status: "queued",
      test_mode: testMode,
      batch_id: thisBatchId,
    }));

    let logIdByEmail: Record<string, string> = {};
    try {
      const { data: insertedLogs, error: logErr } = await supabase
        .from("bulk_email_log")
        .insert(logRows)
        .select("id, recipient_email");
      if (!logErr && insertedLogs) {
        for (const row of insertedLogs) {
          logIdByEmail[(row as any).recipient_email] = (row as any).id;
        }
        setDeliveries((prev) =>
          prev.map((d) => ({ ...d, logId: logIdByEmail[d.email] }))
        );
      }
    } catch (e) {
      console.warn("Failed to write audit log", e);
    }

    const updateDelivery = async (email: string, status: DeliveryStatus, error?: string) => {
      setDeliveries((prev) =>
        prev.map((d) => (d.email === email ? { ...d, status, error } : d))
      );
      const logId = logIdByEmail[email];
      if (logId) {
        await supabase
          .from("bulk_email_log")
          .update({
            status,
            error_message: error ?? null,
            sent_at: status === "sent" ? new Date().toISOString() : null,
          })
          .eq("id", logId);
      }
    };

    try {
      if (personalize || testMode) {
        // Send individually for per-recipient status tracking
        for (let i = 0; i < effectiveRecipients.length; i += 8) {
          const slice = effectiveRecipients.slice(i, i + 8);
          await Promise.all(
            slice.map(async (r) => {
              try {
                const { error } = await supabase.functions.invoke("send-email", {
                  body: {
                    type: "custom",
                    to: r.email,
                    subject: testMode ? `[TEST] ${subject}` : subject,
                    content: message,
                    recipientName: r.name || undefined,
                  },
                });
                if (error) await updateDelivery(r.email, "failed", error.message || "Send failed");
                else await updateDelivery(r.email, "sent");
              } catch (e: any) {
                await updateDelivery(r.email, "failed", e?.message || "Send failed");
              }
            })
          );
        }
      } else {
        // BCC-style batches — mark all in batch with same status
        for (let i = 0; i < effectiveRecipients.length; i += BATCH_SIZE) {
          const slice = effectiveRecipients.slice(i, i + BATCH_SIZE);
          try {
            const { error } = await supabase.functions.invoke("send-email", {
              body: {
                type: "custom",
                to: slice.map((r) => r.email),
                subject,
                content: message,
              },
            });
            const status: DeliveryStatus = error ? "failed" : "sent";
            const errMsg = error?.message;
            await Promise.all(slice.map((r) => updateDelivery(r.email, status, errMsg)));
          } catch (e: any) {
            await Promise.all(
              slice.map((r) => updateDelivery(r.email, "failed", e?.message || "Send failed"))
            );
          }
        }
      }

      // Read final counts from state via callback
      setDeliveries((prev) => {
        const s = prev.filter((d) => d.status === "sent").length;
        const f = prev.filter((d) => d.status === "failed").length;
        if (f === 0) toast.success(`Email sent to ${s} recipient${s === 1 ? "" : "s"}`);
        else if (s === 0) toast.error(`Failed to send to all ${f} recipients`);
        else toast.warning(`Sent to ${s}, failed for ${f}`);
        return prev;
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (sending) return;
    if (!o) {
      // Reset delivery list when closing
      setDeliveries([]);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email learners
          </DialogTitle>
          <DialogDescription>
            {testMode ? (
              <>Test mode: will send only to <strong>{adminEmail ?? "you"}</strong>.</>
            ) : (
              <>Sending to <strong>{validRecipients.length}</strong> recipient
                {validRecipients.length === 1 ? "" : "s"} from {audienceLabel}.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
            <div className="flex items-start gap-2">
              <FlaskConical className="h-4 w-4 mt-0.5 text-primary" />
              <div className="text-sm">
                <Label htmlFor="test-mode" className="cursor-pointer font-medium">
                  Test mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send only to your address ({adminEmail ?? "loading..."}) before broadcasting.
                </p>
              </div>
            </div>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line..."
              className="mt-1"
              disabled={sending}
            />
          </div>
          <div>
            <Label htmlFor="bulk-message">Message</Label>
            <Textarea
              id="bulk-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message. Plain text — line breaks are preserved."
              rows={8}
              className="mt-1"
              disabled={sending}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="personalize"
              checked={personalize}
              onCheckedChange={(v) => setPersonalize(!!v)}
              disabled={sending || testMode}
            />
            <div className="text-sm">
              <Label htmlFor="personalize" className="cursor-pointer">
                Personalize with each learner's name
              </Label>
              <p className="text-xs text-muted-foreground">
                Sends one email per learner. Slower, but greets them by name.
              </p>
            </div>
          </div>

          {!testMode && validRecipients.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> No valid email addresses in this audience.
            </div>
          )}

          {deliveries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" /> Queued {queuedCount}
                </Badge>
                <Badge className="gap-1 bg-green-600 hover:bg-green-600 text-white">
                  <CheckCircle2 className="h-3 w-3" /> Sent {sentCount}
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Failed {failedCount}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {sentCount + failedCount} / {deliveries.length}
                  {sending && (
                    <span className="ml-2 inline-flex items-center gap-1 text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" /> live
                    </span>
                  )}
                  {lastUpdateAt && (
                    <span className="ml-2 text-[10px]">
                      updated {new Date(lastUpdateAt).toLocaleTimeString()}
                    </span>
                  )}
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-md border text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50 text-xs">
                    <tr>
                      <th className="text-left p-2">Recipient</th>
                      <th className="text-left p-2 w-24">Status</th>
                      <th className="text-left p-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d.email} className="border-t">
                        <td className="p-2">
                          <div className="font-medium truncate max-w-[200px]">{d.email}</div>
                          {d.name && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{d.name}</div>}
                        </td>
                        <td className="p-2">
                          {d.status === "sent" && (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3 w-3" /> Sent</span>
                          )}
                          {d.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3 w-3" /> Failed</span>
                          )}
                          {d.status === "queued" && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Queued</span>
                          )}
                        </td>
                        <td className="p-2 text-xs text-destructive truncate max-w-[220px]">
                          {d.error || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!sending && (
                <p className="text-xs text-muted-foreground">
                  Full audit log saved.
                </p>
              )}
            </div>
          )}

          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Hide" : "Show"} audit log (recent sends)
            </button>
            {showHistory && (
              <div className="mt-3">
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No emails sent yet.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2">When</th>
                          <th className="text-left p-2">Recipient</th>
                          <th className="text-left p-2">Subject</th>
                          <th className="text-left p-2">Sender</th>
                          <th className="text-left p-2 w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id} className="border-t">
                            <td className="p-2 whitespace-nowrap text-muted-foreground">
                              {new Date(h.created_at).toLocaleString()}
                            </td>
                            <td className="p-2 truncate max-w-[160px]" title={h.recipient_email}>
                              {h.recipient_email}
                            </td>
                            <td className="p-2 truncate max-w-[200px]" title={h.subject}>
                              {h.test_mode && <Badge variant="outline" className="mr-1 text-[10px]">TEST</Badge>}
                              {h.subject}
                            </td>
                            <td className="p-2 truncate max-w-[140px] text-muted-foreground" title={h.sender_email ?? ""}>
                              {h.sender_email ?? "—"}
                            </td>
                            <td className="p-2">
                              {h.status === "sent" && <span className="text-green-600">Sent</span>}
                              {h.status === "failed" && <span className="text-destructive" title={h.error_message ?? ""}>Failed</span>}
                              {h.status === "queued" && <span className="text-muted-foreground">Queued</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={sending}>
            {deliveries.length > 0 && !sending ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleSend} disabled={sending || effectiveRecipients.length === 0}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {testMode ? "Send test email" : `Send to ${effectiveRecipients.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;