import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Clock, Calendar, CheckCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AvailableProductsProps {
  userId: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price_ugx: number;
  price_usd: number;
  duration: string | null;
  start_date: string | null;
  is_active: boolean;
}

export const AvailableProducts = ({ userId }: AvailableProductsProps) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [enrolledProductIds, setEnrolledProductIds] = useState<Set<string>>(new Set());
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [savedRowIds, setSavedRowIds] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [userId]);

  const loadProducts = async () => {
    try {
      // Load all active products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load user's successful payments to determine enrolled products
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("product_id")
        .eq("user_id", userId)
        .eq("status", "success");

      if (paymentsError) throw paymentsError;

      const enrolledIds = new Set(
        (payments || [])
          .filter(p => p.product_id)
          .map(p => p.product_id as string)
      );
      setEnrolledProductIds(enrolledIds);

      // Load saved products for quick bookmark toggling
      const { data: saved } = await supabase
        .from("saved_products")
        .select("id, product_id")
        .eq("user_id", userId);
      const savedMap = new Map<string, string>();
      (saved || []).forEach((s: any) => savedMap.set(s.product_id, s.id));
      setSavedProductIds(new Set(savedMap.keys()));
      setSavedRowIds(savedMap);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (product: Product) => {
    if (savedProductIds.has(product.id)) {
      const rowId = savedRowIds.get(product.id);
      if (!rowId) return;
      const { error } = await supabase.from("saved_products").delete().eq("id", rowId);
      if (error) return toast.error("Couldn't remove");
      setSavedProductIds((s) => {
        const n = new Set(s);
        n.delete(product.id);
        return n;
      });
      setSavedRowIds((m) => {
        const n = new Map(m);
        n.delete(product.id);
        return n;
      });
      toast.success("Removed from saved");
    } else {
      const { data, error } = await supabase
        .from("saved_products")
        .insert({ user_id: userId, product_id: product.id })
        .select("id")
        .maybeSingle();
      if (error || !data) return toast.error("Couldn't save");
      setSavedProductIds((s) => new Set(s).add(product.id));
      setSavedRowIds((m) => new Map(m).set(product.id, data.id));
      toast.success("Saved for later");
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "certificate":
        return <Badge variant="default">Certificate</Badge>;
      case "bootcamp":
        return <Badge variant="secondary">Bootcamp</Badge>;
      default:
        return <Badge variant="outline">Program</Badge>;
    }
  };

  const handleEnroll = (product: Product) => {
    navigate(`/checkout?product=${product.slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products available</h3>
          <p className="text-muted-foreground">
            Check back soon for new courses and programs.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const categoryTitles: Record<string, string> = {
    certificate: "Certificate Programs",
    bootcamp: "Bootcamps",
    program: "Programs",
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <div key={category}>
          <h3 className="text-xl font-semibold mb-4">
            {categoryTitles[category] || category}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryProducts.map((product) => {
              const isEnrolled = enrolledProductIds.has(product.id);

              return (
                <Card key={product.id} className={isEnrolled ? "border-green-500/50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {getCategoryBadge(product.category)}
                    </div>
                    {product.description && (
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Product details */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {product.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {product.duration}
                          </div>
                        )}
                        {product.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(product.start_date), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-lg font-bold">
                        ${product.price_usd}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          / UGX {product.price_ugx.toLocaleString()}
                        </span>
                      </div>

                      {/* Action button */}
                      {isEnrolled ? (
                        <Button disabled variant="outline" className="w-full gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          Already Enrolled
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={() => handleEnroll(product)} className="flex-1">
                            Enroll Now
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={
                              savedProductIds.has(product.id) ? "Remove from saved" : "Save for later"
                            }
                            onClick={() => toggleSave(product)}
                          >
                            {savedProductIds.has(product.id) ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
