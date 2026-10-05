import React from "react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowUpRight, Newspaper } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaFeatures, type MediaFeature } from "@/hooks/useMediaFeatures";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const FeatureCard = ({ story }: { story: MediaFeature }) => {
  const date = formatDate(story.published_at);
  return (
    <a
      href={story.article_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {story.image_url ? (
          <img
            src={story.image_url}
            alt={story.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Newspaper className="h-8 w-8" />
          </div>
        )}
        {story.outlet_logo_url && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-lg bg-background/95 px-2.5 py-1.5 shadow-sm backdrop-blur">
            <img
              src={story.outlet_logo_url}
              alt={story.outlet_name ?? "Media outlet"}
              loading="lazy"
              className="h-5 w-auto max-w-[92px] object-contain"
            />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {story.outlet_name ?? "In the media"}
          {date && <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">{date}</span>}
        </p>
        <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-3 group-hover:text-primary">
          {story.title}
        </h3>
        {story.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{story.excerpt}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          Read the story
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
};

const MediaFeatures = () => {
  const { data, isLoading } = useMediaFeatures();
  const reduced = useReducedMotion();
  const plugins = React.useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })]),
    [reduced]
  );

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="section-padding bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            As seen in the media
          </p>
          <h2 className="heading-lg">Featured stories</h2>
          <p className="mt-3 text-muted-foreground">
            Independent coverage of our work skilling and placing African youth.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: "start", loop: (data?.length ?? 0) > 3 }} plugins={plugins} className="w-full">
            <CarouselContent className="-ml-4">
              {data!.map((story) => (
                <CarouselItem key={story.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                  <FeatureCard story={story} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {(data?.length ?? 0) > 3 && (
              <div className="mt-6 hidden justify-center gap-2 md:flex">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            )}
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default MediaFeatures;
