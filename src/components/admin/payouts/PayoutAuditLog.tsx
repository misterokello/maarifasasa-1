import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface AuditRow {
  id: string;
  payout_id: string | null;
  referrer_label: string | null;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  amount: number | null;
  currency: string | null;
  actor_label: string | null;
  actor_id: string | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  status_changed: "bg-amber-100 text-amber-800",
  amount_changed: "bg-violet-100 text-violet-800",
  method_changed: "bg-slate-100 text-slate-800",
  reference_changed: "bg-slate-100 text-slate-800",
  deleted: "bg-red-100 text-red-800",
};

const label = (action: string) => action.replace(/_/g, " ");

const PayoutAuditLog = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["payout-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data || []) as unknown as AuditRow[];
    },
  });

  const rows = data || [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Payout audit trail</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every payout change with who made it, when, and the before/after values.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payout changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Before → After</TableHead>
                  <TableHead>Changed by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{row.referrer_label || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`${ACTION_STYLES[row.action] || "bg-muted"} capitalize`}>
                        {label(row.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{row.field || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-muted-foreground line-through">{row.old_value ?? "—"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{row.new_value ?? "—"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.actor_label || row.actor_id?.slice(0, 8) || "system"}
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
};

export default PayoutAuditLog;
