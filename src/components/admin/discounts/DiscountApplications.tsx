import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Loader2, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { DiscountApplicationRow, sendPartnerInvites } from "@/lib/discountAdmin";
import { DiscountCodeForm } from "./DiscountCodeForm";

export function DiscountApplications() {
  const [rows, setRows] = useState<DiscountApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<DiscountApplicationRow | null>(null);
  const [declining, setDeclining] = useState<DiscountApplicationRow | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const inviteLink = `${window.location.origin}/partners/apply`;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discount_code_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as unknown as DiscountApplicationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const decline = async () => {
    if (!declining) return;
    const { error } = await supabase
      .from("discount_code_applications")
      .update({ status: "declined", decline_reason: declineReason.trim() || null })
      .eq("id", declining.id);
    if (error) return toast.error(error.message);
    toast.success("Application declined");
    setDeclining(null);
    setDeclineReason("");
    load();
  };

  const statusVariant = (s: string) =>
    s === "approved" ? "default" : s === "declined" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partner invite link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this link with potential affiliates and influencers. Once they complete the short
            registration and you approve it, their code, link and QR code are generated.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={inviteLink} />
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(inviteLink);
                toast.success("Invite link copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Applications</CardTitle>
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No applications yet.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {r.full_name}{" "}
                        <Badge variant={statusVariant(r.status)} className="ml-2 capitalize">
                          {r.status}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.email}
                        {r.phone ? ` · ${r.phone}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.channel ? `${r.channel} · ` : ""}
                        {r.audience_size ? `audience ${r.audience_size}` : ""}
                        {r.requested_code ? ` · wants ${r.requested_code}` : ""}
                      </p>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => setApproving(r)}>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeclining(r)}>
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  {r.social_links && (
                    <p className="text-xs break-all text-muted-foreground">{r.social_links}</p>
                  )}
                  {r.motivation && <p className="text-sm">{r.motivation}</p>}
                  {r.decline_reason && (
                    <p className="text-xs text-destructive">Declined: {r.decline_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!approving} onOpenChange={(v) => !v && setApproving(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve & create code</DialogTitle>
          </DialogHeader>
          {approving && (
            <DiscountCodeForm
              editing={null}
              prefill={{
                name: approving.full_name,
                email: approving.email,
                requestedCode: approving.requested_code || undefined,
              }}
              onCancel={() => setApproving(null)}
              onDone={async () => {
                const { data } = await supabase
                  .from("discount_codes")
                  .select("id")
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                await supabase
                  .from("discount_code_applications")
                  .update({ status: "approved", discount_code_id: data?.id ?? null })
                  .eq("id", approving.id);
                if (data?.id) {
                  try {
                    const res = await sendPartnerInvites("invite", [data.id]);
                    if (res.sent > 0) {
                      toast.success(`Approved — portal login email sent to ${approving.email}`);
                    } else {
                      toast.error(
                        res.results?.[0]?.detail || "Approved, but the portal email could not be sent",
                      );
                    }
                  } catch (e) {
                    toast.error(
                      (e as Error).message || "Approved, but the portal email could not be sent",
                    );
                  }
                }
                setApproving(null);
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!declining} onOpenChange={(v) => !v && setDeclining(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Reason (optional)</Label>
              <Input
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeclining(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={decline}>
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}