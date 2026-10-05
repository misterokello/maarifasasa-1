import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { Product, ProductCategory } from "@/types/product";
import { generateCheckoutLink, formatUGX, formatUSD } from "@/lib/api/products";
import { toast } from "sonner";
import ThinkificCourseSelect from "./ThinkificCourseSelect";

interface ProductItemProps {
  product: Product;
  category: ProductCategory;
  onInputChange: (id: string, field: keyof Product, value: string | number | boolean | null) => void;
  onDelete: (id: string) => void;
}

const ProductItem = ({ product, category, onInputChange, onDelete }: ProductItemProps) => {
  const [copied, setCopied] = useState(false);
  const checkoutLink = generateCheckoutLink(product.slug);
  const fullCheckoutUrl = `${window.location.origin}${checkoutLink}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullCheckoutUrl);
      setCopied(true);
      toast.success("Checkout link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={product.is_active}
                onCheckedChange={(checked) => onInputChange(product.id, "is_active", checked)}
              />
              <span className="text-sm text-muted-foreground">
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name and Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`name-${product.id}`}>Name</Label>
            <Input
              id={`name-${product.id}`}
              value={product.name}
              onChange={(e) => onInputChange(product.id, "name", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`slug-${product.id}`}>Slug (URL)</Label>
            <Input
              id={`slug-${product.id}`}
              value={product.slug}
              onChange={(e) => onInputChange(product.id, "slug", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor={`description-${product.id}`}>Description</Label>
          <Textarea
            id={`description-${product.id}`}
            value={product.description || ""}
            onChange={(e) => onInputChange(product.id, "description", e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Duration and Dates (for bootcamps) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`duration-${product.id}`}>Duration</Label>
            <Input
              id={`duration-${product.id}`}
              value={product.duration || ""}
              onChange={(e) => onInputChange(product.id, "duration", e.target.value)}
              placeholder="e.g., 3 weeks, 12 weeks, Self-paced"
              className="mt-1"
            />
          </div>
          {category === "bootcamp" && (
            <>
              <div>
                <Label htmlFor={`start_date-${product.id}`}>Start Date</Label>
                <Input
                  id={`start_date-${product.id}`}
                  type="date"
                  value={product.start_date || ""}
                  onChange={(e) => onInputChange(product.id, "start_date", e.target.value || null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`end_date-${product.id}`}>End Date</Label>
                <Input
                  id={`end_date-${product.id}`}
                  type="date"
                  value={product.end_date || ""}
                  onChange={(e) => onInputChange(product.id, "end_date", e.target.value || null)}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>

        {/* Thinkific Course ID and URL (for certificates and bootcamps) */}
        {(category === "certificate" || category === "bootcamp") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThinkificCourseSelect
              productId={product.id}
              value={product.thinkific_course_id}
              onChange={(value) => onInputChange(product.id, "thinkific_course_id", value)}
            />
            <div>
              <Label htmlFor={`thinkific-url-${product.id}`}>Thinkific Course URL (optional)</Label>
              <Input
                id={`thinkific-url-${product.id}`}
                value={product.thinkific_course_url || ""}
                onChange={(e) => onInputChange(product.id, "thinkific_course_url", e.target.value || null)}
                placeholder="e.g., https://maarifasasa.thinkific.com/courses/my-course"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Direct link to course for confirmation emails
              </p>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`price_ugx-${product.id}`}>Price (UGX)</Label>
            <Input
              id={`price_ugx-${product.id}`}
              type="number"
              min="0"
              value={product.price_ugx}
              onChange={(e) => onInputChange(product.id, "price_ugx", parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formatUGX(product.price_ugx)}
            </p>
          </div>
          <div>
            <Label htmlFor={`price_usd-${product.id}`}>Price (USD)</Label>
            <Input
              id={`price_usd-${product.id}`}
              type="number"
              min="0"
              value={product.price_usd}
              onChange={(e) => onInputChange(product.id, "price_usd", parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formatUSD(product.price_usd)}
            </p>
          </div>
        </div>

        {/* Auto-generated Checkout Link */}
        <div className="bg-muted p-4 rounded-lg">
          <Label className="mb-2 block">Checkout Link (Auto-generated)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={fullCheckoutUrl}
              readOnly
              className="bg-background font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              title="Open checkout page"
            >
              <a href={checkoutLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItem;
