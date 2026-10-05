import React from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaCarouselType } from "embla-carousel";
import { ArrowRight, Briefcase, GraduationCap, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useHeroSlideOrder } from "@/hooks/useHeroSlideOrder";
import { trackCta } from "@/lib/analytics";
import dfaHero from "@/assets/dfa-hero-youths-tablet.jpg";

type Slide = {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
  image: string;
  alt: string;
  badge: { label: string; value: string; caption: string };
};

const chips = [
  { icon: GraduationCap, label: "10,000+ learners trained" },
  { icon: Briefcase, label: "~2,000 verified placements" },
  { icon: Target, label: "UGX 1.2B earned by our talent yearly" },
];

const slides: Slide[] = [
  {
    id: "mission",
    eyebrow: "Pan-African EdTech & Future-of-Work Company",
    title: (
      <>
        Building Africa&apos;s{" "}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Digital Workforce Engine
        </span>
      </>
    ),
    body: (
      <>
        We turn Africa&apos;s digital potential into real earning power, affordably, accessibly, and
        with outcomes we can prove. Our mission: unlock{" "}
        <strong className="text-foreground">1,000,000 digital earning opportunities</strong> across
        Africa by 2030.
      </>
    ),
    primary: { label: "Start Learning to Earn", to: "/learning" },
    secondary: { label: "Hire or partner with us", to: "/partners" },
    image: "/lovable-uploads/58928ad6-b263-4564-9df1-f54365aba727.jpg",
    alt: "Young African professionals building digital skills on laptops at a Maarifasasa training session",
    badge: { label: "Mission by 2030", value: "1,000,000", caption: "digital earning opportunities" },
  },
  {
    id: "learners",
    eyebrow: "For learners",
    title: (
      <>
        Learn the skills.{" "}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Start earning in months.
        </span>
      </>
    ),
    body: (
      <>
        Job-focused certificates, bootcamps and the Talent Accelerator, with mobile money and
        instalment options, mentorship, and placement support that gets you paid work.
      </>
    ),
    primary: { label: "Explore programmes", to: "/learning" },
    secondary: { label: "Talk to an advisor", to: "/advisor" },
    image: dfaHero,
    alt: "African youth learning on a tablet during a Maarifasasa digital skills session",
    badge: { label: "Verified outcomes", value: "~2,000", caption: "digital job placements" },
  },
  {
    id: "enterprise",
    eyebrow: "For employers, funders & governments",
    title: (
      <>
        Hire{" "}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          job-ready African talent
        </span>{" "}
        with proof
      </>
    ),
    body: (
      <>
        Co-design cohorts, fund measurable outcomes, and recruit from a pipeline of assessed,
        AI-ready digital talent — with reporting you can take to your board.
      </>
    ),
    primary: { label: "Partner with us", to: "/partners" },
    secondary: { label: "Talk to our team", to: "/contact" },
    image: "/lovable-uploads/a9fec6d9-0cef-4ab4-b323-43b856e36551.jpg",
    alt: "Maarifasasa partners and employers meeting about digital talent placement",
    badge: { label: "Talent earnings", value: "UGX 1.2B", caption: "generated annually" },
  },
];

const HomeHero = () => {
  const reduced = useReducedMotion();
  const { data: slideOrder } = useHeroSlideOrder();
  // Slide order (and which slide leads) is managed by admins in the Media & homepage module.
  const orderedSlides = React.useMemo(() => {
    const byId = new Map(slides.map((slide) => [slide.id, slide]));
    const ordered = (slideOrder ?? []).map((id) => byId.get(id)).filter(Boolean) as Slide[];
    const missing = slides.filter((slide) => !ordered.includes(slide));
    return ordered.length ? [...ordered, ...missing] : slides;
  }, [slideOrder]);
  const [api, setApi] = React.useState<EmblaCarouselType | null>(null);
  const [current, setCurrent] = React.useState(0);

  const plugins = React.useMemo(
    () => (reduced ? [] : [Autoplay({ delay: 7000, stopOnInteraction: true, stopOnMouseEnter: true })]),
    [reduced]
  );

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="relative overflow-hidden" aria-label="Maarifasasa highlights">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-background to-background" />
      <div className="absolute -top-24 right-[6%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-[4%] h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start", watchDrag: true, containScroll: "trimSnaps" }}
          plugins={plugins}
          className="w-full"
        >
          <CarouselContent className="touch-pan-y cursor-grab active:cursor-grabbing">
            {orderedSlides.map((slide, index) => (
              <CarouselItem key={slide.id}>
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
                  <div className="max-w-2xl space-y-7">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span>{slide.eyebrow}</span>
                    </div>

                    <h1 className="heading-xl">{slide.title}</h1>

                    <p className="text-lg text-muted-foreground sm:text-xl">{slide.body}</p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button asChild size="lg" className="group min-h-[48px]">
                        <Link
                          to={slide.primary.to}
                          onClick={() =>
                            trackCta({
                              id: `hero_primary_${slide.id}`,
                              label: slide.primary.label,
                              location: "hero",
                              destination: slide.primary.to,
                              audience: slide.id === "enterprise" ? "enterprise" : "learner",
                              stage: "intent",
                              extra: { slide: slide.id, slide_index: index },
                            })
                          }
                        >
                          {slide.primary.label}
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="min-h-[48px]">
                        <Link
                          to={slide.secondary.to}
                          onClick={() =>
                            trackCta({
                              id: `hero_secondary_${slide.id}`,
                              label: slide.secondary.label,
                              location: "hero",
                              destination: slide.secondary.to,
                              audience: slide.id === "enterprise" ? "enterprise" : "learner",
                              stage: "consideration",
                              extra: { slide: slide.id },
                            })
                          }
                        >
                          {slide.secondary.label}
                        </Link>
                      </Button>
                    </div>

                    <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground">
                      {chips.map((chip) => (
                        <li key={chip.label} className="flex items-center gap-2">
                          <chip.icon className="h-4 w-4 text-primary" />
                          <span>{chip.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay" />
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        width={1200}
                        height={800}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        decoding="async"
                        draggable={false}
                        className="h-[260px] w-full object-cover sm:h-[340px] lg:h-[420px]"
                      />
                    </div>

                    <div className="glass-panel absolute -bottom-5 -left-4 rounded-xl p-4 shadow-lg sm:-left-6">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {slide.badge.label}
                      </p>
                      <p className="text-2xl font-bold">{slide.badge.value}</p>
                      <p className="text-xs text-muted-foreground">{slide.badge.caption}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="hidden lg:flex" />
          <CarouselNext className="hidden lg:flex" />

          <div className="mt-10 flex items-center justify-center gap-3">
            {orderedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={current === index}
                className={`h-2 rounded-full transition-all ${
                  current === index ? "w-8 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default HomeHero;
