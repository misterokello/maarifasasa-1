import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fmtCurrency } from "@/lib/currencyFormat";
import { EARNED_STATUSES, type ReferrerBalance } from "@/hooks/useReferrerPayouts";

interface Props {
  referrer: ReferrerBalance | null;
  onClose: () => void;
}

interface BreakdownRow {
  id: string;
  created_at: string;
  product: string;
  code: string | null;
  currency: string;
  orderAmount: number | null;
  discountAmount: number | null;
  commissionPercent: number | null;
  commission: number;
  status: string;
  buyer: string | null;
}

const CommissionBreakdownSheet = ({ referrer, onClose }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["commission-breakdown", referrer?.key],
    enabled: !!referrer,
    queryFn: async (): Promise<BreakdownRow[]> => {
      if (!referrer) return [];

      if (referrer.kind === "affiliate" && referrer.affiliateId) {
        const { data, error } = await supabase
          .from("affiliate_conversions")
          .select("id, created_at, order_amount, commission_amount, currency, status, products(name), payments(payer_email)")
          .eq("affiliate_id", referrer.affiliateId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || [])
          .filter((r: any) => EARNED_STATUSES.has(r.status) && (r.currency || "USD").toUpperCase() === referrer.currency)
          .map((r: any) => ({
            id: r.id,
            created_at: r.created_at,
            product: r.products?.name || "Unknown course",
            code: null,
            currency: (r.currency || "USD").toUpperCase(),
            orderAmount: Number(r.order_amount || 0),
            discountAmount: null,
            commissionPercent: r.order_amount ? (Number(r.commission_amount) / Number(r.order_amount)) * 100 : null,
            commission: Number(r.commission_amount || 0),
            status: r.status,
            buyer: r.payments?.payer_email ?? null,
          }));
      }

      if (referrer.discountCodeId) {
        const { data, error } = await supabase
          .from("discount_code_redemptions")
          .select("id, created_at, original_amount, discount_amount, charged_amount, commission_percent, commission_amount, currency, status, payer_email, products(name), discount_codes(code)")
          .eq("discount_code_id", referrer.discountCodeId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || [])
          .filter((r: any) => EARNED_STATUSES.has(r.status) && (r.currency || "USD").toUpperCase() === referrer.currency)
          .map((r: any) => ({
            id: r.id,
            created_at: r.created_at,
            product: r.products?.name || "Unknown course",
            code: r.discount_codes?.code ?? null,
            currency: (r.currency || "USD").toUpperCase(),
            orderAmount: Number(r.original_amount || 0),
            discountAmount: Number(r.discount_amount || 0),
            commissionPercent: r.commission_percent !== null ? Number(r.commission_percent) : null,
            commission: Number(r.commission_amount || 0),
            status: r.status,
            buyer: r.payer_email ?? null,
          }));
      }

      return [];
    },
  });

  const rows = data || [];
  const total = rows.reduce((sum, r) => sum + r.commission, 0);

  return (
    <Sheet open={!!referrer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Commission breakdown</SheetTitle>
          <SheetDescription>
            {referrer
              ? `${referrer.label} — ${referrer.currency} · ${referrer.conversions} transaction(s) · earned ${fmtCurrency(referrer.earned, referrer.currency)}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No individual transactions found for this balance.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(row.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{row.product}</p>
                        {row.buyer && <p className="text-xs text-muted-foreground">{row.buyer}</p>}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{row.code || "—"}</TableCell>
                      <TableCell className="text-right text-sm">
                        {row.orderAmount ? fmtCurrency(row.orderAmount, row.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {row.discountAmount ? `-${fmtCurrency(row.discountAmount, row.currency)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.commissionPercent !== null ? `${row.commissionPercent.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-emerald-600">
                        {fmtCurrency(row.commission, row.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="font-medium">Total earned ({referrer?.currency})</TableCell>
                    <TableCell className="text-right font-bold">
                      {fmtCurrency(total, referrer?.currency || "USD")}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommissionBreakdownSheet;
