import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MobileMoneyFormProps {
  productSlug: string;
  priceUGX: number;
  onPaymentInitiated: (paymentId: string) => void;
  referralCode?: string | null;
  isInstallment?: boolean;
  discountCode?: string | null;
}

export function MobileMoneyForm({ productSlug, priceUGX, onPaymentInitiated, referralCode, isInstallment, discountCode }: MobileMoneyFormProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("iotec-collect", {
        body: {
          product_slug: productSlug,
          payer_phone: phone,
          payer_name: name,
          payer_email: email,
          referral_code: referralCode || undefined,
          is_installment: isInstallment || false,
          discount_code: discountCode || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to initiate payment");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Payment Request Sent",
        description: "Please check your phone and approve the payment.",
      });

      onPaymentInitiated(data.payment_id);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Mobile Money Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="0700123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your MTN or Airtel Mobile Money number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
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
            Sending Payment Request...
          </>
        ) : (
          <>
            <Smartphone className="mr-2 h-5 w-5" />
            Pay {formatUGX(priceUGX)} with Mobile Money
          </>
        )}
      </Button>
    </form>
  );
}
