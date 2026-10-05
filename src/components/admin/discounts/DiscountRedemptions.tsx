import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CommissionStatus = "pending" | "approved" | "paid";

interface Row {
  id: string;
  created_at: string;
  payer_email: string | null;
  currency: string;
  original_amount: number;
  discount_amount: number;
  charged_amount: number;
  commission_amount: number;
  status: string;
  commission_status: CommissionStatus;
  commission_status_updated_at: string | null;
  discount_codes: { code: string; owner_name: string | null } | null;
  products: { name: string } | null;
}

export function DiscountRedemptions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discount_code_redemptions")
      .select(
        "id, created_at, payer_email, currency, original_amount, discount_amount, charged_amount, commission_amount, status, commission_status, commission_status_updated_at, discount_codes(code, owner_name), products(name)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) toast.error(error.message);
    setRows((data || []) as unknown as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: CommissionStatus) => {
    setSaving(id);
    const { data, error } = await supabase.functions.invoke("discount-commission-status", {
      body: { redemption_id: id, status },
    });
    setSaving(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Could not update status");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, commission_status: status, commission_status_updated_at: new Date().toISOString() }
          : r,
      ),
    );
    toast.success(
      status === "paid"
        ? "Marked as paid — the partner has been notified"
        : `Commission marked ${status}`,
    );
  };

  const money = (v: number, c: string) =>
    c === "UGX" ? `UGX ${Number(v).toLocaleString()}` : `$${Number(v).toLocaleString()}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Redemptions</CardTitle>
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
            No code redemptions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Charged</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Commission status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">{r.discount_codes?.code || "—"}</TableCell>
                    <TableCell className="text-sm">{r.products?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.payer_email || "—"}</TableCell>
                    <TableCell className="text-right">{money(r.original_amount, r.currency)}</TableCell>
                    <TableCell className="text-right">{money(r.discount_amount, r.currency)}</TableCell>
                    <TableCell className="text-right">{money(r.charged_amount, r.currency)}</TableCell>
                    <TableCell className="text-right">{money(r.commission_amount, r.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "paid" ? "default" : "secondary"} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.commission_status}
                        onValueChange={(v) => updateStatus(r.id, v as CommissionStatus)}
                        disabled={saving === r.id}
                      >
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}