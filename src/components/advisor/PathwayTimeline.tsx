import { motion } from "framer-motion";
import { Check, MapPin, Calendar } from "lucide-react";
import { AdvisorProductBrief, PathwayStep } from "@/types/advisor";

interface Props {
  pathway: PathwayStep[];
  products: Record<string, AdvisorProductBrief>;
}

export default function PathwayTimeline({ pathway, products }: Props) {
  if (!pathway || pathway.length === 0) return null;
  const sorted = [...pathway].sort((a, b) => a.month - b.month);

  return (
    <div className="relative">
      <div className="absolute left-4 md:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-teal-500" />
      <div className="space-y-6">
        {sorted.map((step, i) => {
          const product = step.product_slug ? products[step.product_slug] : null;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex gap-4 md:gap-6"
            >
              <div className="relative shrink-0">
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg ${
                  step.is_target
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-200"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600"
                }`}>
                  {step.is_target ? <MapPin className="w-4 h-4 md:w-5 md:h-5" /> : <Check className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">
                    {step.month === 0 ? "Today" : `Month ${step.month}`}
                  </span>
                  {step.is_target && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">Your goal</span>
                  )}
                </div>
                <p className="text-foreground font-medium leading-snug">{step.milestone}</p>
                {product && (
                  <div className="text-sm text-muted-foreground mt-1">→ {product.name}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}