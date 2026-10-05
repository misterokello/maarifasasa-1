import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fmtCurrency } from "@/lib/currencyFormat";
import type { ReferrerBalance } from "@/hooks/useReferrerPayouts";

interface RecordPayoutDialogProps {
  referrer: ReferrerBalance | null;
  onClose: () => void;
}

const RecordPayoutDialog = ({ referrer, onClose }: RecordPayoutDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [method, setMethod] = useState("mobile_money");
  const [reference, setReference] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (referrer) {
      setAmount(referrer.outstanding ? referrer.outstanding.toFixed(2) : "");
      setStatus("pending");
      setMethod("mobile_money");
      setReference("");
      setPeriodStart("");
      setPeriodEnd("");
      setNotes("");
    }
  }, [referrer]);

  const save = useMutation({
    mutationFn: async () => {
      if (!referrer) return;
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a payout amount greater than zero");

      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("affiliate_payouts").insert({
        affiliate_id: referrer.affiliateId,
        discount_code_id: referrer.discountCodeId,
        referrer_label: referrer.label,
        amount: value,
        currency: referrer.currency,
        method,
        reference: reference.trim() || null,
        status,
        notes: notes.trim() || null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout recorded");
      queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-audit-log"] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Could not record payout"),
  });

  return (
    <Dialog open={!!referrer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payout</DialogTitle>
          <DialogDescription>
            {referrer
              ? `${referrer.label} — outstanding ${fmtCurrency(referrer.outstanding, referrer.currency)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payout-amount">Amount ({referrer?.currency})</Label>
              <Input
                id="payout-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "pending" | "paid")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile money</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-ref">Reference</Label>
              <Input
                id="payout-ref"
                placeholder="Transaction ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payout-from">Period from</Label>
              <Input id="payout-from" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-to">Period to</Label>
              <Input id="payout-to" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payout-notes">Notes</Label>
            <Textarea id="payout-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPayoutDialog;