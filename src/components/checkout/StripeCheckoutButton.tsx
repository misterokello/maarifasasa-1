import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StripeCheckoutButtonProps {
  productSlug: string;
  priceUSD: number;
  referralCode?: string | null;
  isInstallment?: boolean;
  discountCode?: string | null;
}

export function StripeCheckoutButton({ productSlug, priceUSD, referralCode, isInstallment, discountCode }: StripeCheckoutButtonProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          product_slug: productSlug,
          payer_email: email,
          payer_name: name,
          success_url: `${baseUrl}/payment-success`,
          cancel_url: `${baseUrl}/payment-cancelled`,
          referral_code: referralCode || undefined,
          is_installment: isInstallment || false,
          discount_code: discountCode || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to create checkout session");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stripe-name">Full Name</Label>
        <Input
          id="stripe-name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-email">Email Address</Label>
        <Input
          id="stripe-email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          We'll send your receipt and course access to this email
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirecting to Checkout...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay {formatUSD(priceUSD)} with Card
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You'll be redirected to Stripe's secure checkout page
      </p>
    </form>
  );
}
