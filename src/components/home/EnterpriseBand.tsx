import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Building2, Gift, Server, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import DemoRequestDialog from "@/components/home/DemoRequestDialog";
import { trackCta } from "@/lib/analytics";

const doors = [
  { icon: Briefcase, title: "Employers", copy: "Hire job-ready, vetted digital talent." },
  { icon: Gift, title: "Funders & foundations", copy: "Fund a proven, outcomes-based model." },
  { icon: Building2, title: "Governments", copy: "Co-deliver youth & digital agendas." },
  { icon: Server, title: "Tech partners", copy: "Reach & certify AI-ready talent at scale." },
  { icon: TrendingUp, title: "Investors", copy: "Back Africa's talent-infrastructure layer." },
];

const EnterpriseBand = () => {
  return (
    <section className="bg-muted/50 py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Partner with us
            </p>
            <h2 className="heading-lg">Let&apos;s build it together</h2>
            <p className="mt-3 text-muted-foreground">
              A reliable, scalable pipeline of verified, job-ready African digital talent — with the
              rigour and reporting partners require.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <DemoRequestDialog
              location="enterprise_band"
              trigger={
                <Button size="lg" className="min-h-[48px]">
                  Request a demo
                </Button>
              }
            />
            <Button asChild size="lg" variant="outline" className="group min-h-[48px]">
              <Link
                to="/partners"
                onClick={() =>
                  trackCta({
                    id: "enterprise_explore_partnerships",
                    label: "Explore partnership options",
                    location: "enterprise_band",
                    destination: "/partners",
                    audience: "enterprise",
                    stage: "consideration",
                  })
                }
              >
                Explore partnership options
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {doors.map((door) => (
            <Link
              key={door.title}
              to="/partners"
              onClick={() =>
                trackCta({
                  id: `enterprise_door_${door.title.toLowerCase().replace(/[^a-z]+/g, "_")}`,
                  label: door.title,
                  location: "enterprise_doors",
                  destination: "/partners",
                  audience: "enterprise",
                  stage: "consideration",
                })
              }
              className="hover-lift group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <door.icon className="h-5 w-5" />
              </span>
              <span className="font-semibold">{door.title}</span>
              <span className="text-sm text-muted-foreground">{door.copy}</span>
              <span className="mt-auto inline-flex items-center text-sm font-medium text-primary">
                Get started
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnterpriseBand;
