import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusPollerProps {
  paymentId: string;
  onCancel: () => void;
}

export function PaymentStatusPoller({ paymentId, onCancel }: PaymentStatusPollerProps) {
  const [status, setStatus] = useState<"pending" | "processing" | "success" | "failed" | "timeout">("pending");
  const [pollCount, setPollCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const MAX_POLLS = 24; // 2 minutes at 5 second intervals

  useEffect(() => {
    if (status === "success" || status === "failed" || status === "timeout") {
      return;
    }

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("iotec-status", {
          body: { payment_id: paymentId },
        });

        if (error) {
          console.error("Status poll error:", error);
          return;
        }

        if (data.status === "success") {
          setStatus("success");
          toast({
            title: "Payment Successful!",
            description: "Your payment has been confirmed.",
          });
          setTimeout(() => {
            navigate(`/payment-success?payment_id=${paymentId}`);
          }, 1500);
        } else if (data.status === "failed") {
          setStatus("failed");
          toast({
            title: "Payment Failed",
            description: "The payment was not completed. Please try again.",
            variant: "destructive",
          });
        } else {
          setStatus(data.status === "processing" ? "processing" : "pending");
        }
      } catch (err) {
        console.error("Status poll exception:", err);
      }

      setPollCount((prev) => prev + 1);
    };

    if (pollCount >= MAX_POLLS) {
      setStatus("timeout");
      toast({
        title: "Payment Timeout",
        description: "The payment request timed out. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // Initial poll

    return () => clearInterval(interval);
  }, [paymentId, pollCount, status, navigate, toast]);

  return (
    <div className="text-center py-8 space-y-6">
      {(status === "pending" || status === "processing") && (
        <>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Smartphone className="h-16 w-16 text-primary/30" />
              </div>
              <Smartphone className="h-16 w-16 text-primary relative" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Check Your Phone</h3>
            <p className="text-muted-foreground">
              A payment request has been sent to your mobile money number.
              <br />
              Please enter your PIN to approve the transaction.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting for payment confirmation...
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Redirecting you to the confirmation page...
            </p>
          </div>
        </>
      )}

      {status === "failed" && (
        <>
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-destructive">Payment Failed</h3>
            <p className="text-muted-foreground mb-4">
              The payment could not be completed. This might happen if:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-xs mx-auto space-y-1">
              <li>• You cancelled the transaction on your phone</li>
              <li>• Insufficient balance in your account</li>
              <li>• Entered incorrect PIN</li>
            </ul>
          </div>
          <Button onClick={onCancel}>Try Again</Button>
        </>
      )}

      {status === "timeout" && (
        <>
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-amber-600">Payment Timeout</h3>
            <p className="text-muted-foreground mb-4">
              We didn't receive a confirmation within the expected time.
              <br />
              If you completed the payment, it may still be processing.
            </p>
          </div>
          <Button onClick={onCancel}>Try Again</Button>
        </>
      )}
    </div>
  );
}
