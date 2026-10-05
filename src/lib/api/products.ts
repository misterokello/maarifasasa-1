import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/product";
import { toast } from "sonner";
import slugify from "slugify";

export async function fetchProductsByCategory(category: ProductCategory): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    toast.error("Failed to load products");
    return [];
  }

  return data as Product[];
}

export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    toast.error("Failed to load products");
    return [];
  }

  return data as Product[];
}

export async function saveProduct(product: Product): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      program_type: product.program_type ?? null,
      price_ugx: product.price_ugx,
      price_usd: product.price_usd,
      duration: product.duration,
      start_date: product.start_date,
      end_date: product.end_date,
      stripe_price_id: product.stripe_price_id,
      thinkific_course_id: product.thinkific_course_id,
      thinkific_course_url: product.thinkific_course_url,
      is_active: product.is_active,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", product.id);

  if (error) {
    console.error("Error saving product:", error);
    toast.error("Failed to save product");
    return false;
  }

  return true;
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  const slug = slugify(product.name, { lower: true, strict: true });
  
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...product,
      slug,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    toast.error("Failed to create product");
    return null;
  }

  return data as Product;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    toast.error("Failed to delete product");
    return false;
  }

  return true;
}

export async function toggleProductActive(productId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling product:", error);
    toast.error("Failed to update product status");
    return false;
  }

  return true;
}

export function generateCheckoutLink(slug: string): string {
  return `/checkout?product=${slug}`;
}

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
