import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, UserRound } from "lucide-react";

type CommissionStatus = "pending" | "approved" | "paid";

interface SignupRow {
  id: string;
  full_name: string | null;
  email: string | null;
  user_id: string | null;
  created_at: string;
}

interface RedemptionRow {
  id: string;
  discount_code_id: string;
  created_at: string;
  user_id: string | null;
  payer_email_masked: string | null;
  currency: string;
  commission_amount: number;
  commission_status: CommissionStatus;
  commission_paid_at: string | null;
  product_name: string | null;
}

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
};

const STATUS_VARIANT: Record<CommissionStatus, "secondary" | "outline" | "default"> = {
  pending: "secondary",
  approved: "outline",
  paid: "default",
};

const money = (v: number, c: string) =>
  c === "UGX" ? `UGX ${Number(v).toLocaleString()}` : `$${Number(v).toLocaleString()}`;

const firstNames = (name: string | null, fallback: string) =>
  (name || "").trim() || fallback;

export const PartnerReferralActivity = ({ codeIds }: { codeIds: string[] }) => {
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (codeIds.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const [s, r] = await Promise.all([
        supabase
          .from("discount_code_signups")
          .select("id, full_name, email, user_id, created_at")
          .in("discount_code_id", codeIds)
          .order("created_at", { ascending: false }),
        supabase.rpc("my_referral_redemptions"),
      ]);
      if (!active) return;
      setSignups((s.data || []) as unknown as SignupRow[]);
      const codeSet = new Set(codeIds);
      setRedemptions(
        ((r.data || []) as unknown as RedemptionRow[]).filter((row) =>
          codeSet.has(row.discount_code_id),
        ),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [codeIds.join(",")]);

  const totals = useMemo(() => {
    const sum = (st: CommissionStatus) =>
      redemptions
        .filter((r) => r.commission_status === st)
        .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
    return { pending: sum("pending"), approved: sum("approved"), paid: sum("paid") };
  }, [redemptions]);

  const people = useMemo(() => {
    return signups.map((s, idx) => {
      // Only attribute purchases we can match with certainty (same account).
      // The masked payer email cannot uniquely identify a signup, so it is not used.
      const purchases = s.user_id
        ? redemptions.filter((r) => r.user_id === s.user_id)
        : [];
      return {
        id: s.id,
        name: firstNames(s.full_name, `Referral #${signups.length - idx}`),
        signedUpAt: s.created_at,
        purchases,
      };
    });
  }, [signups, redemptions]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const currency = redemptions[0]?.currency || "UGX";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commission status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["pending", "approved", "paid"] as CommissionStatus[]).map((st) => (
            <div key={st} className="rounded-lg border p-4">
              <p className="text-2xl font-bold">{money(totals[st], currency)}</p>
              <p className="text-xs text-muted-foreground">{STATUS_LABEL[st]}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No commissions yet — share your link to start earning.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{r.product_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        {money(r.commission_amount, r.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.commission_status]}>
                          {STATUS_LABEL[r.commission_status]}
                          {r.commission_status === "paid" && r.commission_paid_at
                            ? ` · ${new Date(r.commission_paid_at).toLocaleDateString()}`
                            : ""}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People who joined via your link</CardTitle>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No signups yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {people.map((p) => (
                <li key={p.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <UserRound className="h-4 w-4 text-primary" />
                    {p.name}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>
                      Signed up · {new Date(p.signedUpAt).toLocaleString()}
                    </li>
                    {p.purchases.map((r) => (
                      <li key={r.id}>
                        Paid for {r.product_name || "a course"} ·{" "}
                        {new Date(r.created_at).toLocaleString()} — commission{" "}
                        {STATUS_LABEL[r.commission_status].toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerReferralActivity;
