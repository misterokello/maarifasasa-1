import React from "react";
import { Link } from "react-router-dom";
import { trackCta } from "@/lib/analytics";
import { ArrowRight, Building2, Check, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const doors = [
  {
    icon: GraduationCap,
    eyebrow: "For learners, parents, communities & universities",
    title: "I want to learn and earn",
    points: [
      "Affordable, mobile-first, AI-ready training",
      "A real bridge from certificate to paid work",
      "Community, mentorship and lifelong growth",
    ],
    cta: "Explore learning programmes",
    link: "/learning",
    highlight: true,
  },
  {
    icon: Building2,
    eyebrow: "For employers, investors, governments & partners",
    title: "I'm hiring or partnering",
    points: [
      "Vetted, job-ready African digital talent",
      "Outcomes-based delivery with funder-grade reporting",
      "Co-deliver youth employment and digital agendas",
    ],
    cta: "Partner with Maarifasasa",
    link: "/partners",
    highlight: false,
  },
];

const AudienceSplit = () => {
  return (
    <section className="bg-background py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="heading-lg mb-3">One story, many doors</h2>
          <p className="text-lg text-muted-foreground">
            Whichever door you come through, the mission is the same.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {doors.map((door) => (
            <Card
              key={door.title}
              className={`hover-lift h-full ${
                door.highlight ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <CardContent className="flex h-full flex-col p-6 sm:p-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <door.icon className="h-6 w-6" />
                </div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {door.eyebrow}
                </p>
                <h3 className="heading-sm mb-4">{door.title}</h3>
                <ul className="mb-6 space-y-3">
                  {door.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={door.highlight ? "default" : "outline"}
                  className="group mt-auto min-h-[44px] w-full sm:w-auto"
                >
                  <Link
                    to={door.link}
                    onClick={() =>
                      trackCta({
                        id: `audience_${door.title.toLowerCase().replace(/[^a-z]+/g, "_")}`,
                        label: door.title,
                        location: "audience_split",
                        destination: door.link,
                        stage: "intent",
                      })
                    }
                  >
                    {door.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSplit;
