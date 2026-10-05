import React from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, CalendarDays, Clock, Tag } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedCourses } from "@/hooks/useHomepageContent";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fmtCurrency } from "@/lib/currencyFormat";
import { personaliseProducts, useLearnerGoals, goalLabel } from "@/lib/learnerPreferences";
import { trackCta } from "@/lib/analytics";
import type { Product } from "@/types/product";

const CATEGORY_LABELS: Record<string, string> = {
  certificate: "Certificate",
  bootcamp: "Bootcamp",
  program: "Programme",
};

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export const CourseCardItem = ({ product }: { product: Product }) => {
  const starts = formatDate(product.start_date);

  return (
    <Card className="hover-lift flex h-full flex-col border-border">
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{CATEGORY_LABELS[product.category] ?? product.category}</Badge>
          {product.program_type === "talent_accelerator" && (
            <Badge className="bg-accent text-accent-foreground">Talent Accelerator</Badge>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{product.name}</h3>
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {product.description || "Job-focused, AI-ready training built for African realities."}
        </p>

        <ul className="mb-5 space-y-2 text-sm text-muted-foreground">
          {product.duration && (
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{product.duration}</span>
            </li>
          )}
          {starts && (
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Starts {starts}</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {fmtCurrency(Number(product.price_ugx || 0), "UGX")}
              {" · "}
              {fmtCurrency(Number(product.price_usd || 0), "USD")}
            </span>
          </li>
        </ul>

        {product.category === "bootcamp" && (
          <p className="mb-4 rounded-lg bg-accent/10 px-3 py-2 text-xs text-foreground/80">
            Pay 50% now with the instalment option at checkout.
          </p>
        )}

        <Button asChild className="group mt-auto min-h-[44px] w-full">
          <Link
            to={`/checkout?product=${product.slug}`}
            onClick={() =>
              trackCta({
                id: "course_enrol",
                label: "Start Learning to Earn",
                location: "featured_courses",
                destination: `/checkout?product=${product.slug}`,
                audience: "learner",
                stage: "conversion",
                extra: { product_slug: product.slug, product_name: product.name, category: product.category },
              })
            }
          >
            Start Learning to Earn
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export const CourseSkeletons = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border p-6">
        <Skeleton className="mb-3 h-5 w-24" />
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-4 h-16 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    ))}
  </div>
);

const FeaturedCoursesCarousel = () => {
  const { data, isLoading } = useFeaturedCourses();
  const reduced = useReducedMotion();
  const [goals] = useLearnerGoals();

  const courses = React.useMemo(
    () => personaliseProducts(data ?? [], goals),
    [data, goals]
  );

  const plugins = React.useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })]),
    [reduced]
  );

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/40">
        <div className="container mx-auto">
          <h2 className="heading-lg mb-8">Featured courses</h2>
          <CourseSkeletons />
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="section-padding bg-secondary/40">
      <div className="container mx-auto">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Enrol now
            </p>
            <h2 className="heading-lg">Featured courses</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {goals.length > 0
                ? `Matched to your goals: ${goals.map(goalLabel).join(", ")}.`
                : "Certificates, bootcamps and accelerator programmes shaped by employer demand."}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/learning" className="flex items-center">
              View all programmes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Carousel opts={{ align: "start", loop: courses.length > 3 }} plugins={plugins} className="w-full">
          <CarouselContent className="-ml-4">
            {courses.map((product) => (
              <CarouselItem key={product.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                <CourseCardItem product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 hidden justify-end gap-2 md:flex">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
        <p className="mt-4 text-center text-xs text-muted-foreground md:hidden">Swipe to see more</p>
      </div>
    </section>
  );
};

export default FeaturedCoursesCarousel;
