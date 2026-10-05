import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Save, RotateCcw } from "lucide-react";
import { Product, ProductCategory } from "@/types/product";
import { 
  fetchProductsByCategory, 
  saveProduct, 
  deleteProduct, 
  createProduct 
} from "@/lib/api/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProductItem from "./ProductItem";
import slugify from "slugify";

interface ProductManagementProps {
  category: ProductCategory;
  title: string;
  description: string;
  defaultProductName: string;
}

const ProductManagement = ({ 
  category, 
  title, 
  description, 
  defaultProductName 
}: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProductsByCategory(category);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`products-${category}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          // Only reload if it's the same category
          if (
            payload.new && 
            (payload.new as Product).category === category
          ) {
            loadProducts();
          } else if (
            payload.old && 
            (payload.old as Product).category === category
          ) {
            loadProducts();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [category]);

  const handleInputChange = (
    id: string,
    field: keyof Product,
    value: string | number | boolean | null
  ) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== id) return product;
        
        // Auto-generate slug when name changes
        if (field === "name" && typeof value === "string") {
          return {
            ...product,
            [field]: value,
            slug: slugify(value, { lower: true, strict: true }),
          };
        }
        
        return { ...product, [field]: value };
      })
    );
    setEdited(true);
  };

  const handleAddProduct = async () => {
    const newProduct = await createProduct({
      name: defaultProductName,
      slug: slugify(defaultProductName, { lower: true, strict: true }),
      description: "Product description goes here",
      category,
      price_ugx: category === "bootcamp" ? 350000 : 20000,
      price_usd: category === "bootcamp" ? 95 : 6,
      duration: category === "bootcamp" ? "3 weeks" : "Self-paced",
      start_date: category === "bootcamp" ? new Date().toISOString().split("T")[0] : null,
      end_date: category === "bootcamp" 
        ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] 
        : null,
      stripe_price_id: null,
      thinkific_course_id: null,
      thinkific_course_url: null,
      is_active: true,
    });

    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
      toast.success("Product created successfully");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      return;
    }

    const success = await deleteProduct(id);
    if (success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted successfully");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const savePromises = products.map((product) => saveProduct(product));
      const results = await Promise.all(savePromises);
      
      if (results.every(Boolean)) {
        toast.success("All products saved successfully");
        setEdited(false);
      } else {
        toast.error("Some products failed to save");
      }
    } catch (error) {
      console.error("Error saving products:", error);
      toast.error("Failed to save products");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    if (edited && !window.confirm("You have unsaved changes. Refresh anyway?")) {
      return;
    }
    loadProducts();
    setEdited(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Loading {title}...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleRefresh} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddProduct} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={!edited || saving}
            variant={edited ? "default" : "outline"}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">No products found in this category.</p>
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div>
          {products.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              category={category}
              onInputChange={handleInputChange}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
