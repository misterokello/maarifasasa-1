import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AdvisorProductBrief, RecommendationPrimary } from "@/types/advisor";
import { formatUGX, formatUSD } from "@/lib/api/products";

interface Props {
  primary: RecommendationPrimary;
  product: AdvisorProductBrief | undefined;
}

const CATEGORY_LABEL: Record<string, string> = {
  certificate: "Certificate",
  bootcamp: "Bootcamp",
  program: "Talent Accelerator",
};

export default function RecommendationCard({ primary, product }: Props) {
  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 text-white p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Star className="w-3 h-3 mr-1 fill-current" /> Best fit for you
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white bg-white/10">
              {CATEGORY_LABEL[product.category] || product.category}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < primary.fit_score ? "fill-yellow-300 text-yellow-300" : "text-white/30"}`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h3>
          <p className="text-white/90 text-lg">{primary.headline}</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Why this fits you</h4>
            <p className="text-muted-foreground leading-relaxed">{primary.reasoning}</p>
          </div>

          {primary.outcomes?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3">What you'll achieve</h4>
              <ul className="space-y-2">
                {primary.outcomes.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {primary.honest_caveat && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-amber-900 text-sm mb-1">An honest note</div>
                <p className="text-sm text-amber-900/90">{primary.honest_caveat}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t">
            <div>
              <div className="text-2xl font-bold text-foreground">{formatUGX(product.price_ugx)}</div>
              <div className="text-sm text-muted-foreground">or {formatUSD(product.price_usd)}{product.duration ? ` · ${product.duration}` : ""}</div>
            </div>
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white">
              <Link to={`/checkout?product=${product.slug}`}>
                Start Learning to Earn
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}