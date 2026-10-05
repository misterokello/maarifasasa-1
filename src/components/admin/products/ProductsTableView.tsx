import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Save, RotateCcw, Trash2, Edit, ExternalLink, Copy, Check, Search } from "lucide-react";
import { Product, ProductCategory } from "@/types/product";
import {
  fetchProductsByCategory,
  saveProduct,
  deleteProduct,
  createProduct,
  generateCheckoutLink,
  formatUGX,
  formatUSD,
} from "@/lib/api/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import slugify from "slugify";
import ProductEditForm from "./ProductEditForm";

interface ProductsTableViewProps {
  category: ProductCategory;
  title: string;
  description: string;
  defaultProductName: string;
}

const ProductsTableView = ({
  category,
  title,
  description,
  defaultProductName,
}: ProductsTableViewProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProductsByCategory(category);
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const subscription = supabase
      .channel(`products-${category}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          if (
            (payload.new && (payload.new as Product).category === category) ||
            (payload.old && (payload.old as Product).category === category)
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

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleAddProduct = async () => {
    setSaving(true);
    try {
      const newProduct = await createProduct({
        name: defaultProductName,
        slug: slugify(defaultProductName, { lower: true, strict: true }),
        description: "Product description goes here",
        category,
        program_type: category === "program" ? "partner_program" : null,
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
        setEditingProduct(newProduct);
        toast.success("Product created successfully");
      }
    } finally {
      setSaving(false);
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

  const handleToggleActive = async (product: Product) => {
    const updatedProduct = { ...product, is_active: !product.is_active };
    const success = await saveProduct(updatedProduct);
    if (success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p))
      );
      toast.success(`Product ${updatedProduct.is_active ? "activated" : "deactivated"}`);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    setSaving(true);
    try {
      const success = await saveProduct(product);
      if (success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? product : p))
        );
        setEditingProduct(null);
        toast.success("Product saved successfully");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async (product: Product) => {
    const checkoutLink = generateCheckoutLink(product.slug);
    const fullCheckoutUrl = `${window.location.origin}${checkoutLink}`;
    try {
      await navigator.clipboard.writeText(fullCheckoutUrl);
      setCopiedId(product.id);
      toast.success("Checkout link copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button variant="outline" onClick={loadProducts} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddProduct} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add New
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No products match your search." : "No products found in this category."}
          </p>
          {!searchQuery && (
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Price (UGX)</TableHead>
                <TableHead className="text-right">Price (USD)</TableHead>
                {category === "bootcamp" && <TableHead>Dates</TableHead>}
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => handleToggleActive(product)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.duration || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatUGX(product.price_ugx)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatUSD(product.price_usd)}
                  </TableCell>
                  {category === "bootcamp" && (
                    <TableCell>
                      {product.start_date ? (
                        <div className="text-sm">
                          <p>{new Date(product.start_date).toLocaleDateString()}</p>
                          {product.end_date && (
                            <p className="text-muted-foreground">
                              to {new Date(product.end_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(product)}
                        title="Copy checkout link"
                      >
                        {copiedId === product.id ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Open checkout"
                      >
                        <a
                          href={generateCheckoutLink(product.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and pricing information.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductEditForm
              product={editingProduct}
              category={category}
              onSave={handleSaveProduct}
              onCancel={() => setEditingProduct(null)}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsTableView;
