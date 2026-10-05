import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Share2, Trophy } from "lucide-react";
import { DiscountShareDialog } from "@/components/admin/discounts/DiscountShareDialog";
import PartnerReferralActivity from "@/components/partner/PartnerReferralActivity";

export interface MyCode {
  id: string;
  code: string;
  label: string | null;
  percent_off: number;
  commission_percent: number;
  clicks: number;
  signups_count: number;
  redemptions_count: number;
  total_commission: number;
  is_active: boolean;
}

const SELECT =
  "id, code, label, percent_off, commission_percent, clicks, signups_count, redemptions_count, total_commission, is_active";

/**
 * Claims any partner code whose owner_email matches the signed-in user's email
 * (server-side, security definer) and returns the codes they own.
 */
export async function fetchMyPartnerCodes(userId: string): Promise<MyCode[]> {
  await (supabase as any).rpc("claim_my_partner_codes");
  const { data } = await supabase
    .from("discount_codes")
    .select(SELECT)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []) as unknown as MyCode[];
}

export const PartnerPortalPanel = ({ userId }: { userId: string }) => {
  const [codes, setCodes] = useState<MyCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<MyCode | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await fetchMyPartnerCodes(userId);
      if (!active) return;
      setCodes(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Trophy className="h-10 w-10 text-primary mx-auto" />
          <p className="text-muted-foreground">
            You don't have a referral code linked to this account yet.
          </p>
          <Button asChild>
            <Link to="/partners/apply">Apply to become a partner</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {codes.map((c) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-mono flex items-center gap-2">
              {c.code}
              <Badge variant={c.is_active ? "default" : "secondary"}>
                {c.is_active ? `${c.percent_off}% off` : "Inactive"}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSharing(c)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Clicks", value: c.clicks },
                { label: "Signups", value: c.signups_count },
                { label: "Paid sales", value: c.redemptions_count },
                {
                  label: "Commission",
                  value: Number(c.total_commission || 0).toLocaleString(),
                },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <PartnerReferralActivity codeIds={codes.map((c) => c.id)} />

      {sharing && (
        <DiscountShareDialog
          open={!!sharing}
          onOpenChange={(v) => !v && setSharing(null)}
          code={sharing.code}
          label={sharing.label}
        />
      )}
    </div>
  );
};

export default PartnerPortalPanel;
