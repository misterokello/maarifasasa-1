import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet, Search, ListTree } from "lucide-react";
import { fmtCurrency } from "@/lib/currencyFormat";
import { useReferrerBalances, type ReferrerBalance } from "@/hooks/useReferrerPayouts";
import RecordPayoutDialog from "./RecordPayoutDialog";
import CommissionBreakdownSheet from "./CommissionBreakdownSheet";

const PayoutBalances = () => {
  const { balances, isLoading } = useReferrerBalances();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReferrerBalance | null>(null);
  const [breakdown, setBreakdown] = useState<ReferrerBalance | null>(null);

  const filtered = balances.filter((b) =>
    `${b.label} ${b.email ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Commission balances by referrer</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search referrer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No commissions earned yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <p className="font-medium">{row.label}</p>
                        {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {row.kind === "affiliate" ? "Affiliate" : "Discount code"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="link" className="h-auto p-0" onClick={() => setBreakdown(row)}>
                          {row.conversions}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.earned, row.currency)}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(row.paid, row.currency)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmtCurrency(row.pending, row.currency)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {fmtCurrency(row.outstanding, row.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="mr-1" onClick={() => setBreakdown(row)}>
                          <ListTree className="h-4 w-4 mr-1" />
                          Breakdown
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                          <Wallet className="h-4 w-4 mr-1" />
                          Record payout
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

      <RecordPayoutDialog referrer={selected} onClose={() => setSelected(null)} />
      <CommissionBreakdownSheet referrer={breakdown} onClose={() => setBreakdown(null)} />
    </>
  );
};

export default PayoutBalances;