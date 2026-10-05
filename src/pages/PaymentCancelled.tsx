import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  return (
    <>
      <Helmet>
        <title>Payment Cancelled | Maarifasasa</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
              <XCircle className="h-12 w-12 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-amber-700 mb-2">Payment Cancelled</h1>
            <p className="text-muted-foreground text-lg">
              Your payment was not completed. No charges were made.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="py-8 text-center">
              <h2 className="text-lg font-semibold mb-4">What happened?</h2>
              <p className="text-muted-foreground mb-6">
                The payment process was cancelled or interrupted. This could happen if:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-sm mx-auto space-y-2 mb-6">
                <li>• You closed the payment window</li>
                <li>• Your card was declined</li>
                <li>• You clicked the back button</li>
                <li>• The session expired</li>
              </ul>
              <p className="text-sm font-medium">
                Don't worry - you haven't been charged anything.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link to="/programs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Programs
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Need help with your payment?
              </p>
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://wa.me/256757615175?text=Hi!%20I'm%20having%20trouble%20with%20a%20payment"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat with Support
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCancelled;
