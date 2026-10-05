import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, ArrowRight, Loader2 } from "lucide-react";
import { getAffiliateRef, clearStoredAffiliateRef } from "@/lib/affiliateIntegration";

interface PaymentDetails {
  id: string;
  payer_name: string;
  payer_email: string;
  amount: number;
  currency: string;
  payment_method: string;
  product_id: string | null;
  metadata: {
    product_name?: string;
    product_slug?: string;
    referral_code?: string;
    affiliate_code?: string;
    thinkific_express_sign_in_url?: string;
    thinkific_is_new_user?: boolean;
  };
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const conversionFallbackAttempted = useRef(false);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        // For successful Stripe payments, update the status
        const sessionId = searchParams.get("session_id");
        if (sessionId) {
          // The webhook should handle this, but we'll update just in case
          await supabase
            .from("payments")
            .update({ status: "success", completed_at: new Date().toISOString() })
            .eq("id", paymentId)
            .eq("status", "pending");
        }

        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("id", paymentId)
          .maybeSingle();

        if (data) {
          setPayment(data as PaymentDetails);
        }
      } catch (err) {
        console.error("Error fetching payment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, searchParams]);

  // Fallback: send direct conversion to external affiliate system if webhook
  // may not have fired (e.g. webhook secret misconfigured, network issue).
  // This is safe because the external endpoint is idempotent by payment ID.
  useEffect(() => {
    if (!payment || conversionFallbackAttempted.current) return;
    if (payment.metadata?.product_slug == null) return;

    const affiliateCode =
      payment.metadata?.affiliate_code ||
      payment.metadata?.referral_code ||
      getAffiliateRef();

    if (!affiliateCode) return;

    conversionFallbackAttempted.current = true;

    const orderAmount =
      payment.currency === "USD"
        ? payment.amount / 100
        : payment.amount;

    // Fire-and-forget via our proxy edge function
    supabase.functions
      .invoke("affiliate-proxy", {
        body: {
          action: "track-conversion",
          payload: {
            affiliate_code: affiliateCode,
            order_amount: orderAmount,
            currency: payment.currency,
            product_slug: payment.metadata.product_slug,
            mother_conversion_id: payment.id,
          },
        },
      })
      .then(({ error }) => {
        if (error) {
          console.error("[affiliate] Fallback conversion failed:", error);
        } else {
          console.debug("[affiliate] Fallback conversion sent for payment", payment.id);
          // Clear the stored ref now that conversion is recorded
          clearStoredAffiliateRef();
        }
      });
  }, [payment]);

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "UGX") {
      return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100); // Stripe stores in cents
  };

  return (
    <>
      <Helmet>
        <title>Payment Successful | Maarifasasa</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase. You're now enrolled!
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          ) : payment ? (
            <Card className="mb-8">
              <CardContent className="py-8">
                <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Product</dt>
                    <dd className="font-medium">{payment.metadata?.product_name || "Program Enrollment"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-medium">{formatAmount(payment.amount, payment.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Payment Method</dt>
                    <dd className="font-medium capitalize">
                      {payment.payment_method === "mobile_money" ? "Mobile Money" : "Card"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{payment.payer_name}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ) : null}

          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Check Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent your receipt and course access details to{" "}
                    <span className="font-medium">{payment?.payer_email || "your email"}</span>.
                    Please check your inbox (and spam folder).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-center">What's Next?</h3>
            <div className="grid gap-3">
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Access Your Courses</p>
                    <p className="text-sm text-muted-foreground">
                      {payment?.metadata?.thinkific_is_new_user 
                        ? "Check your email to set your password, then start learning"
                        : "Start learning right away"}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <a
                      href={payment?.metadata?.thinkific_express_sign_in_url || "https://maarifasasa.thinkific.com/users/sign_in"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Go to Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Join Our Community</p>
                    <p className="text-sm text-muted-foreground">Connect with other learners</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="https://wa.me/256757615175?text=Hi!%20I%20just%20enrolled%20in%20a%20program"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
