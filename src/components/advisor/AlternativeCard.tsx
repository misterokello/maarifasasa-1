import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AdvisorProductBrief, RecommendationAlternative } from "@/types/advisor";
import { formatUGX } from "@/lib/api/products";

const CATEGORY_LABEL: Record<string, string> = {
  certificate: "Certificate",
  bootcamp: "Bootcamp",
  program: "Talent Accelerator",
};

export default function AlternativeCard({
  alt,
  product,
}: {
  alt: RecommendationAlternative;
  product: AdvisorProductBrief | undefined;
}) {
  if (!product) return null;
  return (
    <Card className="p-5 hover-lift h-full flex flex-col">
      <Badge variant="secondary" className="self-start mb-3">{CATEGORY_LABEL[product.category] || product.category}</Badge>
      <h4 className="font-bold text-lg text-foreground mb-1">{product.name}</h4>
      <p className="text-sm text-muted-foreground mb-3"><span className="font-medium text-foreground">vs primary:</span> {alt.vs_primary}</p>
      <p className="text-sm text-muted-foreground mb-4"><span className="font-medium text-foreground">Best for:</span> {alt.best_for}</p>
      <div className="mt-auto flex items-center justify-between pt-3 border-t">
        <span className="font-semibold text-foreground">{formatUGX(product.price_ugx)}</span>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/checkout?product=${product.slug}`}>
            View <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}