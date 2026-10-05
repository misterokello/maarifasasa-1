import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { fmtCurrency } from "@/lib/currencyFormat";
import { usePayouts, type PayoutRecord } from "@/hooks/useReferrerPayouts";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
};

const PayoutLedger = () => {
  const { data: payouts, isLoading } = usePayouts();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [toDelete, setToDelete] = useState<PayoutRecord | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("affiliate_payouts")
        .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout status updated");
      queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-audit-log"] });
    },
    onError: (err: any) => toast.error(err.message || "Could not update payout"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_payouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout deleted");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["payout-audit-log"] });
    },
    onError: (err: any) => toast.error(err.message || "Could not delete payout"),
  });

  const rows = (payouts || []).filter((p) => filter === "all" || p.status === filter);

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Payout history</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No payouts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recorded</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-sm">{format(new Date(payout.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{payout.referrer_label || "—"}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(Number(payout.amount), payout.currency)}</TableCell>
                      <TableCell className="capitalize text-sm">{(payout.method || "—").replace("_", " ")}</TableCell>
                      <TableCell className="text-sm">{payout.reference || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {payout.period_start || payout.period_end
                          ? `${payout.period_start || "…"} → ${payout.period_end || "…"}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_STYLES[payout.status] || "bg-muted"} capitalize`}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={payout.status}
                          onValueChange={(status) => updateStatus.mutate({ id: payout.id, status })}
                        >
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(payout)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payout record?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the payout from the ledger and restores the referrer's outstanding balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PayoutLedger;