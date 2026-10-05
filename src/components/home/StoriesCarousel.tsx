import React from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import SuccessStory from "@/components/SuccessStory";
import { successStories } from "@/lib/api";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const StoriesCarousel = () => {
  const reduced = useReducedMotion();
  const plugins = React.useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 7000, stopOnInteraction: true, stopOnMouseEnter: true })]),
    [reduced]
  );

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Real earners, real outcomes
          </p>
          <h2 className="heading-lg">Success stories</h2>
          <p className="mt-3 text-muted-foreground">
            Graduates who turned skills into income through our programmes.
          </p>
        </div>

        <Carousel opts={{ align: "start", loop: true }} plugins={plugins} className="w-full">
          <CarouselContent className="-ml-4">
            {successStories.map((story) => (
              <CarouselItem key={story.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                <SuccessStory {...story} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 hidden justify-center gap-2 md:flex">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>

        <div className="mt-10 text-center">
          <Button asChild className="min-h-[44px]">
            <Link to="/about#success-stories">
              Read more success stories
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StoriesCarousel;
