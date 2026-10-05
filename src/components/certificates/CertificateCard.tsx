import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { formatUGX } from "@/lib/api/products";

interface CertificateCardProps {
  product: Product;
}

const CertificateCard = ({ product }: CertificateCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-primary/10 text-primary mb-4">
            <Award className="h-6 w-6" />
          </div>
          {product.duration && (
            <Badge variant="outline" className="text-xs">
              {product.duration}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{product.duration || "Self-paced"}</span>
          </div>
          <span className="font-semibold text-primary">
            {formatUGX(product.price_ugx)}
          </span>
        </div>
        <Button asChild className="w-full group/btn">
          <Link to={`/checkout?product=${product.slug}`}>
            Enroll Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
