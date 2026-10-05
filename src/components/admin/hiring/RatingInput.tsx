import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_MAX, ratingLabel } from "@/lib/hiring";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  showLabel?: boolean;
  readOnly?: boolean;
};

const RatingInput = ({ value, onChange, size = "md", showLabel = true, readOnly }: Props) => {
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" role={readOnly ? undefined : "radiogroup"}>
        {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} of ${RATING_MAX} — ${ratingLabel(n)}`}
            onClick={() => onChange?.(n)}
            className={cn("rounded p-0.5", !readOnly && "hover:scale-110 transition-transform")}
          >
            <Star
              className={cn(
                dim,
                n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {value ? `${value}/${RATING_MAX} · ${ratingLabel(value)}` : "Not rated"}
        </span>
      )}
    </div>
  );
};

export default RatingInput;