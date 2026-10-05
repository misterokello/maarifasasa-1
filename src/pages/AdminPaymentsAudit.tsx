import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck2, MailWarning, AlertTriangle, ReceiptText } from "lucide-react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import PaymentsAuditTable from "@/components/admin/payments/PaymentsAuditTable";
import { supabase } from "@/integrations/supabase/client";

const AdminPaymentsAudit = () => {
  const { data: summary } = useQuery({
    queryKey: ["payments-audit-summary"],
    staleTime: 60_000,
    queryFn: async () => {
      const [{ count: successful }, docs] = await Promise.all([
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "success"),
        supabase
          .from("payment_documents")
          .select("payment_id, storage_path, last_error, email_status, emailed_at"),
      ]);

      const rows = docs.data || [];
      const issued = new Set(rows.filter((r) => r.storage_path).map((r) => r.payment_id)).size;
      const genFailed = new Set(
        rows.filter((r) => !r.storage_path && r.last_error).map((r) => r.payment_id),
      ).size;
      const emailed = new Set(
        rows.filter((r) => r.emailed_at || r.email_status === "sent").map((r) => r.payment_id),
      ).size;
      const emailFailed = new Set(
        rows.filter((r) => r.email_status === "failed" && !r.emailed_at).map((r) => r.payment_id),
      ).size;

      return {
        successful: successful || 0,
        issued,
        genFailed,
        emailed,
        emailFailed,
      };
    },
  });

  const stats = [
    {
      label: "Successful payments",
      value: String(summary?.successful ?? "—"),
      icon: ReceiptText,
      tone: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Documents issued",
      value: String(summary?.issued ?? "—"),
      icon: FileCheck2,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Generation failures",
      value: String(summary?.genFailed ?? "—"),
      icon: AlertTriangle,
      tone: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Email failures",
      value: String(summary?.emailFailed ?? "—"),
      icon: MailWarning,
      tone: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <AdminDashboardLayout
      title="Payments Audit"
      subtitle="Payment status, invoice/receipt generation attempts and email delivery per learner"
    >
      <Helmet>
        <title>Payments Audit | Maarifasasa Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`rounded-lg p-2.5 ${stat.tone}`}>
                <stat.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="truncate text-lg font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <PaymentsAuditTable />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminPaymentsAudit;
