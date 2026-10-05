import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useExperiment } from "@/lib/abTesting";
import { trackCta, track } from "@/lib/analytics";
import { useLearnerGoals } from "@/lib/learnerPreferences";

const steps = [
  {
    number: "01",
    icon: GraduationCap,
    title: "Build the skills",
    tagline: "Academy · Bootcamps · AI & Digital Skills",
    description:
      "World-class, AI-ready training designed for African realities — mobile-first, low-bandwidth, and priced for young people.",
    cta: { label: "Browse programmes", to: "/learning" },
  },
  {
    number: "02",
    icon: Rocket,
    title: "Convert to placements",
    tagline: "Talent Accelerator · Employer Partnerships",
    description:
      "We don't stop at teaching. We bridge verified skills to real, paid work through our accelerator and employer pipeline.",
    cta: { label: "See the Talent Accelerator", to: "/programs/talent-accelerator" },
  },
  {
    number: "03",
    icon: Users,
    title: "Sustain access & belonging",
    tagline: "Digital Impact Hubs · Community of Practice",
    description:
      "A community that keeps learners earning, growing and referring — with mentorship, hubs and lifelong support.",
    cta: { label: "Find your pathway", to: "/advisor" },
  },
];

const PathwayStepper = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const variant = useExperiment("pathway_cta");
  const [goals] = useLearnerGoals();

  // Variant "urgency" swaps in scarcity-led CTA copy.
  const ctaLabel = (index: number) => {
    if (variant !== "urgency") return steps[index].cta.label;
    return ["Enrol in the next cohort", "Apply for placement support", "Join the community"][index];
  };

  // Learners who chose a goal land on the step that matters most to them.
  useEffect(() => {
    if (goals.length === 0) return;
    if (goals.includes("get_a_job")) setActiveIndex(1);
    else if (goals.includes("business")) setActiveIndex(2);
  }, [goals]);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % steps.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const active = steps[activeIndex];

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="heading-lg">One pathway, three moves</h2>
          <p className="mt-3 text-muted-foreground">
            We measure ourselves by earning, not enrolments.
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
        >
          <ol className="space-y-3" role="tablist" aria-label="Learning to earning pathway">
            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={step.number}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveIndex(index);
                      setPaused(true);
                      track("pathway_step_select", { step: step.number, title: step.title });
                    }}
                    className={`flex min-h-[64px] w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step {step.number}
                      </span>
                      <span className="block font-semibold">{step.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{active.tagline}</p>
            <h3 className="heading-sm mt-3">{active.title}</h3>
            <p className="mt-4 text-muted-foreground">{active.description}</p>
            <Button asChild className="group mt-6 min-h-[44px]">
              <Link
                to={active.cta.to}
                onClick={() =>
                  trackCta({
                    id: `pathway_step_${active.number}`,
                    label: ctaLabel(activeIndex),
                    location: "pathway_stepper",
                    destination: active.cta.to,
                    audience: "learner",
                    stage: "consideration",
                    extra: { step: active.number },
                  })
                }
              >
                {ctaLabel(activeIndex)}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <div className="mt-6 flex gap-2" aria-hidden="true">
              {steps.map((step, index) => (
                <span
                  key={step.number}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index === activeIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PathwayStepper;
