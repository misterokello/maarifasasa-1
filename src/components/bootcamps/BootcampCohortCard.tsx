import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { formatUGX } from "@/lib/api/products";
import { format } from "date-fns";

interface BootcampCohortCardProps {
  product: Product;
}

const BootcampCohortCard = ({ product }: BootcampCohortCardProps) => {
  const formatDateRange = () => {
    if (!product.start_date && !product.end_date) return null;
    
    const startDate = product.start_date ? format(new Date(product.start_date), "d MMM") : "";
    const endDate = product.end_date ? format(new Date(product.end_date), "d MMM yyyy") : "";
    
    if (startDate && endDate) {
      return `${startDate} – ${endDate}`;
    }
    return startDate || endDate;
  };

  const dateRange = formatDateRange();

  return (
    <Card className="border-2 hover:shadow-lg transition-all duration-300 border-primary/20">
      <CardContent className="p-6 text-center">
        {product.duration && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            {product.duration}
          </div>
        )}
        <h4 className="text-xl font-bold mb-2">{product.name}</h4>
        {dateRange && (
          <p className="text-muted-foreground mb-4">{dateRange}</p>
        )}
        <div className="text-2xl font-bold text-primary mb-4">
          {formatUGX(product.price_ugx)}
        </div>
        <Button asChild className="w-full group">
          <Link to={`/checkout?product=${product.slug}`}>
            Enroll Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default BootcampCohortCard;
