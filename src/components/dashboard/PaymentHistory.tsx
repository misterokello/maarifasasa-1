import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock, Receipt, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";


interface PaymentHistoryProps {
  userId: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  provider_reference: string | null;
  external_id: string | null;
  metadata: any;
  product: {
    name: string;
    category: string;
  } | null;
}

export const PaymentHistory = ({ userId }: PaymentHistoryProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [docBusy, setDocBusy] = useState<string | null>(null);

  const downloadDocument = async (paymentId: string, docType: "invoice" | "receipt") => {
    const key = `${paymentId}:${docType}`;
    setDocBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("payment-documents", {
        body: { action: "url", payment_id: paymentId, doc_type: docType },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || "Document unavailable");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast({
        title: `Could not open ${docType}`,
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDocBusy(null);
    }
  };


  useEffect(() => {
    loadPayments();
  }, [userId]);

  const loadPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email?.trim().toLowerCase();

      // Payments may be recorded against the account (user_id) or, for guest /
      // pre-signup checkouts, only against the payer's email address.
      const filters = [`user_id.eq.${userId}`];
      if (email) filters.push(`payer_email.ilike.${email}`);

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          currency,
          status,
          payment_method,
          created_at,
          completed_at,
          payer_name,
          payer_email,
          payer_phone,
          provider_reference,
          external_id,
          metadata,
          product:products(name, category)
        `)
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data as any) || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "UGX") {
      return `UGX ${amount.toLocaleString()}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
          <p className="text-muted-foreground">
            Your payment history will appear here once you enroll in a course or program.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            View all your transactions and payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => {
              const meta = payment.metadata || {};
              return (
                <div
                  key={payment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="mt-1">{getStatusIcon(payment.status)}</span>
                      <div>
                        <p className="font-medium">
                          {payment.product?.name || meta.product_name || "Unknown Product"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(new Date(payment.created_at), "MMM d, yyyy • HH:mm")}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {payment.payment_method.replace("_", " ")}
                          </span>
                          {payment.product?.category && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{payment.product.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground pl-0 sm:pl-8">
                    {meta.is_installment && (
                      <p>
                        <span className="font-medium text-foreground">Plan:</span> 50% installment
                        {meta.installment_number ? ` (payment ${meta.installment_number})` : ""}
                      </p>
                    )}
                    {meta.discount_code && (
                      <p>
                        <span className="font-medium text-foreground">Discount:</span>{" "}
                        {meta.discount_code}
                        {meta.discount_percent ? ` (-${meta.discount_percent}%)` : ""}
                      </p>
                    )}
                    {payment.payer_name && (
                      <p>
                        <span className="font-medium text-foreground">Paid by:</span>{" "}
                        {payment.payer_name}
                      </p>
                    )}
                    {payment.payer_email && (
                      <p className="break-all">
                        <span className="font-medium text-foreground">Email:</span>{" "}
                        {payment.payer_email}
                      </p>
                    )}
                    {payment.payer_phone && (
                      <p>
                        <span className="font-medium text-foreground">Phone:</span>{" "}
                        {payment.payer_phone}
                      </p>
                    )}
                    {payment.completed_at && (
                      <p>
                        <span className="font-medium text-foreground">Completed:</span>{" "}
                        {format(new Date(payment.completed_at), "MMM d, yyyy • HH:mm")}
                      </p>
                    )}
                    {(payment.provider_reference || payment.external_id) && (
                      <p className="break-all">
                        <span className="font-medium text-foreground">Reference:</span>{" "}
                        <span className="font-mono">
                          {payment.provider_reference || payment.external_id}
                        </span>
                      </p>
                    )}
                  </div>

                  {payment.status === "success" && (
                    <div className="flex flex-wrap gap-2 pl-0 sm:pl-8 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={docBusy === `${payment.id}:invoice`}
                        onClick={() => downloadDocument(payment.id, "invoice")}
                      >
                        {docBusy === `${payment.id}:invoice` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        Invoice (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={docBusy === `${payment.id}:receipt`}
                        onClick={() => downloadDocument(payment.id, "receipt")}
                      >
                        {docBusy === `${payment.id}:receipt` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Receipt (PDF)
                      </Button>
                    </div>
                  )}
                </div>

              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
