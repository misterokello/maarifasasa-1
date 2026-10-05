import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X, CheckCircle2 } from "lucide-react";
import {
  DISCOUNT_REASON_LABELS,
  clearStoredDiscountCode,
  getStoredDiscountCode,
  resolveDiscountCode,
  setStoredDiscountCode,
} from "@/lib/discountCodes";

export interface AppliedDiscount {
  code: string;
  percentOff: number;
  label: string | null;
}

interface DiscountCodeFieldProps {
  productSlug: string;
  applied: AppliedDiscount | null;
  onApply: (discount: AppliedDiscount | null) => void;
}

export function DiscountCodeField({ productSlug, applied, onApply }: DiscountCodeFieldProps) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const autoTried = useRef(false);

  const validate = async (raw: string, silent = false) => {
    const code = raw.trim();
    if (!code) return;
    setChecking(true);
    setMessage(null);
    const result = await resolveDiscountCode(code, productSlug);
    setChecking(false);

    if (result?.valid && result.percent_off) {
      onApply({
        code: result.code || code.toUpperCase(),
        percentOff: Number(result.percent_off),
        label: result.label ?? null,
      });
      setStoredDiscountCode(result.code || code);
      setValue("");
      return;
    }

    onApply(null);
    if (!silent) {
      setMessage(
        (result?.reason && DISCOUNT_REASON_LABELS[result.reason]) ||
          "We couldn't apply that code.",
      );
    }
  };

  // Auto-apply a code captured from a referral link
  useEffect(() => {
    if (autoTried.current || applied) return;
    autoTried.current = true;
    const stored = getStoredDiscountCode();
    if (stored) validate(stored, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  if (applied) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              Code {applied.code} applied
              <Badge variant="secondary" className="ml-2">{applied.percentOff}% off</Badge>
            </p>
            {applied.label && (
              <p className="text-xs text-muted-foreground mt-0.5">{applied.label}</p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onApply(null);
            clearStoredDiscountCode();
            setMessage(null);
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="discount-code" className="text-sm font-semibold flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Discount code
      </Label>
      <div className="flex gap-2">
        <Input
          id="discount-code"
          placeholder="Enter code"
          value={value}
          maxLength={40}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              validate(value);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => validate(value)}
          disabled={checking || !value.trim()}
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}