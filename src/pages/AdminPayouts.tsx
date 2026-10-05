import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import PayoutBalances from "@/components/admin/payouts/PayoutBalances";
import PayoutLedger from "@/components/admin/payouts/PayoutLedger";
import PayoutAuditLog from "@/components/admin/payouts/PayoutAuditLog";
import { useReferrerBalances } from "@/hooks/useReferrerPayouts";
import { fmtMultiCurrency } from "@/lib/currencyFormat";

const AdminPayouts = () => {
  const { balances, payouts } = useReferrerBalances();

  const stats = [
    {
      label: "Commissions earned",
      value: fmtMultiCurrency(balances.map((b) => ({ commission_amount: b.earned, currency: b.currency }))),
      icon: TrendingUp,
      tone: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Paid out",
      value: fmtMultiCurrency(payouts.filter((p) => p.status === "paid").map((p) => ({ commission_amount: Number(p.amount), currency: p.currency }))),
      icon: CheckCircle2,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Pending payouts",
      value: fmtMultiCurrency(payouts.filter((p) => p.status === "pending").map((p) => ({ commission_amount: Number(p.amount), currency: p.currency }))),
      icon: Clock,
      tone: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Outstanding balance",
      value: fmtMultiCurrency(balances.map((b) => ({ commission_amount: b.outstanding, currency: b.currency }))),
      icon: Wallet,
      tone: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <AdminDashboardLayout
      title="Affiliate Payouts"
      subtitle="Track commissions per referrer and mark payouts as pending or paid"
    >
      <Helmet>
        <title>Affiliate Payouts | Maarifasasa Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${tone.split(" ")[1]}`}>
                <Icon className={`h-4 w-4 ${tone.split(" ")[0]}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-base font-bold truncate">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="balances">
        <TabsList className="bg-muted/50 mb-6">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="history">Payout history</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-0">
          <PayoutBalances />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <PayoutLedger />
        </TabsContent>
        <TabsContent value="audit" className="mt-0">
          <PayoutAuditLog />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default AdminPayouts;