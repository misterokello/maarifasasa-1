import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, BookOpen, CalendarDays, Clock, Rocket, Search } from "lucide-react";
import type { Product, ProductCategory } from "@/types/product";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  certificate: "Advanced certificate",
  bootcamp: "Bootcamp",
  program: "Programme",
};

const CATEGORY_ICONS: Record<ProductCategory, typeof BookOpen> = {
  certificate: Award,
  bootcamp: BookOpen,
  program: Rocket,
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

/** Course card artwork pulled from Thinkific, keyed by Thinkific course id. */
async function fetchThinkificArtwork(): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke("thinkific-courses");
  if (error) throw error;
  const items = (data as { items?: any[] } | null)?.items ?? [];
  const map: Record<string, string> = {};
  for (const item of items) {
    const image = item?.course_card_image_url || item?.banner_image_url;
    if (item?.id != null && image) map[String(item.id)] = image;
  }
  return map;
}

const CourseCatalog = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [currency, setCurrency] = useState<"UGX" | "USD">("UGX");

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["academy-catalog"],
    queryFn: fetchActiveProducts,
    staleTime: 5 * 60 * 1000,
  });

  const hasThinkificLinks = (products ?? []).some((p) => !!p.thinkific_course_id);

  const { data: artwork } = useQuery({
    queryKey: ["academy-thinkific-artwork"],
    queryFn: fetchThinkificArtwork,
    enabled: hasThinkificLinks,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <section id="catalog" className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Course catalog</h2>
          <p className="text-muted-foreground">
            Every course, certificate and programme you can enroll in today — pick one, pay with mobile
            money or card, and your seat is created instantly in the academy.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-8">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search the course catalog"
              placeholder="Search courses..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="certificate">Certificates</TabsTrigger>
                <TabsTrigger value="bootcamp">Bootcamps</TabsTrigger>
                <TabsTrigger value="program">Programmes</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
              <TabsList>
                <TabsTrigger value="UGX">UGX</TabsTrigger>
                <TabsTrigger value="USD">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full rounded-t-lg rounded-b-none" />
                <CardHeader className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-center text-muted-foreground py-12">
            We couldn't load the catalog right now. Please refresh the page.
          </p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No courses match your search</h3>
            <p className="text-muted-foreground">Try a different keyword or category.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const Icon = CATEGORY_ICONS[product.category] ?? BookOpen;
              const start = formatDate(product.start_date);
              const price = currency === "UGX" ? formatUGX(product.price_ugx) : formatUSD(product.price_usd);
              const altPrice = currency === "UGX" ? formatUSD(product.price_usd) : formatUGX(product.price_ugx);
              const image = product.thinkific_course_id
                ? artwork?.[String(product.thinkific_course_id)]
                : undefined;

              return (
                <Card key={product.id} className="flex flex-col overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={`${product.name} course artwork`}
                      loading="lazy"
                      className="h-40 w-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                      <Icon className="h-10 w-10 text-primary" aria-hidden="true" />
                    </div>
                  )}

                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{CATEGORY_LABELS[product.category] ?? product.category}</Badge>
                      {product.program_type === "talent_accelerator" && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Talent Accelerator</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-snug">
                      <Link to={`/academy/${product.slug}`} className="hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                    </CardTitle>
                    {product.description && (
                      <CardDescription className="line-clamp-3">{product.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {product.duration && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> {product.duration}
                        </span>
                      )}
                      {start && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" /> Starts {start}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{price}</p>
                      <p className="text-xs text-muted-foreground">({altPrice})</p>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full" asChild>
                        <Link to={`/academy/${product.slug}`}>View course details</Link>
                      </Button>
                      <Button className="w-full" variant="outline" asChild>
                        <Link to={`/checkout?product=${product.slug}`}>Start Learning to Earn</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseCatalog;
