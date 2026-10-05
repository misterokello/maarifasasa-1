import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, BookmarkX, Compass, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  userId: string;
}

interface SavedRow {
  id: string;
  created_at?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    price_usd: number | null;
    price_ugx: number | null;
    duration: string | null;
    description: string | null;
  } | null;
}

export const SavedCourses = ({ userId }: Props) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "category">("recent");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_products")
      .select(
        `id, created_at, product:products(id, name, slug, category, price_usd, price_ugx, duration, description)`,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[SavedCourses]", error);
      toast.error("Failed to load saved courses");
    } else {
      setRows((data as unknown as SavedRow[]) || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeSaved = async (id: string) => {
    const { error } = await supabase.from("saved_products").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove from saved");
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Removed from saved");
  };

  if (loading) return <Skeleton className="h-56 w-full" />;

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No saved courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Tap the bookmark on any course in Explore to save it for later.
          </p>
          <Button onClick={() => navigate("/learning-programs")} className="gap-2">
            <Compass className="h-4 w-4" />
            Explore programs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (!q) return true;
    const p = r.product;
    if (!p) return false;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const ap = a.product;
    const bp = b.product;
    switch (sort) {
      case "name-asc":
        return (ap?.name || "").localeCompare(bp?.name || "");
      case "name-desc":
        return (bp?.name || "").localeCompare(ap?.name || "");
      case "price-asc":
        return (ap?.price_usd ?? Infinity) - (bp?.price_usd ?? Infinity);
      case "price-desc":
        return (bp?.price_usd ?? -Infinity) - (ap?.price_usd ?? -Infinity);
      case "category":
        return (ap?.category || "").localeCompare(bp?.category || "");
      case "recent":
      default:
        return (b.created_at || "").localeCompare(a.created_at || "");
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved courses..."
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently saved</SelectItem>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="price-asc">Price (low to high)</SelectItem>
            <SelectItem value="price-desc">Price (high to low)</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No saved courses match "{query}".
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((row) => (
        <Card key={row.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base line-clamp-2">
                {row.product?.name || "Course"}
              </CardTitle>
              {row.product?.category && (
                <Badge variant="outline" className="capitalize shrink-0">
                  {row.product.category}
                </Badge>
              )}
            </div>
            {row.product?.description && (
              <CardDescription className="line-clamp-2">
                {row.product.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="mt-auto space-y-3">
            {row.product?.price_usd != null && (
              <p className="text-sm font-semibold">
                ${row.product.price_usd}
                {row.product.price_ugx != null && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    / UGX {Number(row.product.price_ugx).toLocaleString()}
                  </span>
                )}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => row.product && navigate(`/checkout?product=${row.product.slug}`)}
                disabled={!row.product}
              >
                Start learning to earn
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSaved(row.id)}
                className="gap-2"
              >
                <BookmarkX className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
      )}
    </div>
  );
};