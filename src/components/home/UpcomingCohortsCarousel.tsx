import React from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, CalendarDays, Clock, Flame } from "lucide-react";
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
import { useUpcomingCohorts } from "@/hooks/useHomepageContent";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackCta } from "@/lib/analytics";
import { fmtCurrency } from "@/lib/currencyFormat";

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
};

const daysUntil = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
};

const UpcomingCohortsCarousel = () => {
  const { data, isLoading } = useUpcomingCohorts();
  const reduced = useReducedMotion();

  const plugins = React.useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })]),
    [reduced]
  );

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container mx-auto">
          <h2 className="heading-lg mb-8">Upcoming cohorts</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-border p-6">
                <Skeleton className="mb-3 h-5 w-32" />
                <Skeleton className="mb-2 h-6 w-2/3" />
                <Skeleton className="mb-4 h-14 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
              Seats filling fast
            </p>
            <h2 className="heading-lg">Upcoming bootcamp cohorts</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Intensive, job-focused skilling sprints with live mentorship. Reserve your seat with 50% today.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/programs/bootcamps" className="flex items-center">
              All bootcamps <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Carousel opts={{ align: "start", loop: data.length > 2 }} plugins={plugins} className="w-full">
          <CarouselContent className="-ml-4">
            {data.map((cohort) => {
              const starts = formatDate(cohort.start_date);
              const countdown = daysUntil(cohort.start_date);
              return (
                <CarouselItem key={cohort.id} className="pl-4 md:basis-1/2">
                  <Card className="hover-lift flex h-full flex-col overflow-hidden border-border">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Bootcamp</Badge>
                        {countdown !== null && countdown <= 30 && (
                          <Badge className="bg-accent text-accent-foreground">
                            <Flame className="mr-1 h-3 w-3" />
                            {countdown === 0 ? "Starts today" : `Starts in ${countdown} day${countdown === 1 ? "" : "s"}`}
                          </Badge>
                        )}
                      </div>

                      <h3 className="mb-2 text-xl font-semibold">{cohort.name}</h3>
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {cohort.description || "Hands-on, employer-aligned training with real project work."}
                      </p>

                      <div className="mb-5 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        {starts && (
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {starts}
                          </span>
                        )}
                        {cohort.duration && (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {cohort.duration}
                          </span>
                        )}
                      </div>

                      <p className="mb-5 font-medium">
                        {fmtCurrency(Number(cohort.price_ugx || 0), "UGX")}
                        <span className="text-muted-foreground"> · </span>
                        {fmtCurrency(Number(cohort.price_usd || 0), "USD")}
                        <span className="block text-xs font-normal text-muted-foreground">
                          Or pay 50% now with the instalment plan.
                        </span>
                      </p>

                      <Button asChild className="group mt-auto min-h-[44px] w-full">
                        <Link
                          to={`/checkout?product=${cohort.slug}`}
                          onClick={() =>
                            trackCta({
                              id: "cohort_enrol",
                              label: "Reserve my seat",
                              location: "upcoming_cohorts",
                              destination: `/checkout?product=${cohort.slug}`,
                              audience: "learner",
                              stage: "conversion",
                              extra: { product_slug: cohort.slug, product_name: cohort.name },
                            })
                          }
                        >
                          Reserve my seat
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="mt-6 hidden justify-end gap-2 md:flex">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default UpcomingCohortsCarousel;
