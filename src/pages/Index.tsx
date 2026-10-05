import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import HomeHero from "@/components/home/HomeHero";
import AudienceSplit from "@/components/home/AudienceSplit";
import ImpactStats from "@/components/home/ImpactStats";
import PathwayStepper from "@/components/home/PathwayStepper";
import FeaturedCoursesCarousel from "@/components/home/FeaturedCoursesCarousel";
import UpcomingCohortsCarousel from "@/components/home/UpcomingCohortsCarousel";
import SkillsDomains from "@/components/home/SkillsDomains";
import StoriesCarousel from "@/components/home/StoriesCarousel";
import MediaFeatures from "@/components/home/MediaFeatures";
import EnterpriseBand from "@/components/home/EnterpriseBand";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import LearnerGoals from "@/components/home/LearnerGoals";
import DemoRequestDialog from "@/components/home/DemoRequestDialog";
import TrustedBySection from "@/components/TrustedBySection";
import { useFeaturedCourses } from "@/hooks/useHomepageContent";
import { useExperiment } from "@/lib/abTesting";
import { trackCta } from "@/lib/analytics";

const BASE_URL = "https://maarifasasa.com";

const Index = () => {
  const { data: featured } = useFeaturedCourses();

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Maarifasasa",
    url: BASE_URL,
    logo: `${BASE_URL}/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png`,
    description:
      "Pan-African workforce development company unlocking 1,000,000 digital earning opportunities across Africa by 2030.",
    sameAs: [
      "https://www.linkedin.com/company/maarifasasa",
      "https://twitter.com/maarifasasa",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lira",
      addressCountry: "Uganda",
    },
  };

  const courseListData =
    featured && featured.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Featured Maarifasasa programmes",
          itemListElement: featured.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: `${BASE_URL}/checkout?product=${product.slug}`,
          })),
        }
      : null;

  const finalCtaVariant = useExperiment("final_cta");
  const finalPrimary =
    finalCtaVariant === "enrol"
      ? { label: "Enrol in a programme", to: "/learning" }
      : { label: "Explore programmes", to: "/learning" };

  return (
    <>
      <Helmet>
        <title>Maarifasasa | Digital Skills & Remote Jobs for Africa</title>
        <meta
          name="description"
          content="Learn in-demand digital skills and access global remote work. Join 10,000+ African youth earning in software, data, AI and digital marketing."
        />
        <meta
          name="keywords"
          content="digital skills training Africa, remote jobs Uganda, learn to earn, digital marketing course, web development bootcamp, freelancing Africa, youth employment Uganda, hire African developers, BPO Africa, talent accelerator"
        />
        <link rel="canonical" href={BASE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:title" content="Maarifasasa | Digital Skills & Remote Jobs for Africa" />
        <meta
          property="og:description"
          content="Learn in-demand digital skills and access global remote work. Join 10,000+ African youth earning online."
        />
        <meta
          property="og:image"
          content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`}
        />
        <meta property="og:site_name" content="Maarifasasa" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={BASE_URL} />
        <meta name="twitter:title" content="Maarifasasa | Digital Skills & Remote Jobs for Africa" />
        <meta
          name="twitter:description"
          content="Learn in-demand digital skills and access global remote work. 10,000+ African youth earning online."
        />
        <meta
          name="twitter:image"
          content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`}
        />

        <script type="application/ld+json">{JSON.stringify(organizationData)}</script>
        {courseListData && (
          <script type="application/ld+json">{JSON.stringify(courseListData)}</script>
        )}
      </Helmet>

      <main className="overflow-hidden">
        <HomeHero />
        <AudienceSplit />
        <ImpactStats />
        <section className="bg-muted/40 py-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-5 rounded-xl border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Inside the Maarifasasa Academy
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Short courses, advanced certificates and the 12-week Talent Accelerator — see how
                  each pathway turns skills into income.
                </p>
              </div>
              <Button size="lg" asChild className="shrink-0">
                <Link to="/academy">Explore the Academy</Link>
              </Button>
            </div>
          </div>
        </section>
        <PathwayStepper />
        <LearnerGoals />
        <FeaturedCoursesCarousel />
        <UpcomingCohortsCarousel />
        <SkillsDomains />

        {/* Trust & validation */}
        <TrustedBySection variant="dark" />
        <section className="bg-background py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center sm:flex-row sm:text-left">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="text-sm text-foreground/80">
                Selected for the <strong>Mastercard Foundation EdTech Fellowship</strong>, delivered
                in Uganda by Hive Colab — independent validation of our model for skilling and
                placing African youth.
              </p>
            </div>
          </div>
        </section>

        <MediaFeatures />
        <StoriesCarousel />
        <EnterpriseBand />

        {/* Affiliate band */}
        <section className="bg-gradient-to-r from-primary to-primary/80 py-16 text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="flex max-w-2xl items-start gap-5">
                <div className="shrink-0 rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                  <DollarSign className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="mb-2 text-2xl font-bold md:text-3xl">Earn by sharing knowledge</h2>
                  <p className="text-lg text-primary-foreground/85">
                    Join our Affiliate Program and earn commission every time someone enrols through
                    your link. No cap on earnings — the more you share, the more you earn.
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="min-h-[48px] min-w-[220px] shrink-0 text-base font-semibold"
              >
                <a
                  href="https://affiliates.maarifasasa.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackCta({
                      id: "affiliate_join",
                      label: "Join the Program",
                      location: "affiliate_band",
                      destination: "https://affiliates.maarifasasa.com",
                      audience: "affiliate",
                      stage: "conversion",
                    })
                  }
                >
                  Join the Program
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 z-0 bg-primary/10" />
          <div className="absolute right-0 top-0 h-full w-1/3 origin-top-right -skew-x-12 transform bg-primary/5" />
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="heading-lg mb-6">Ready to start earning from your skills?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                Join thousands of young Africans who have turned digital skills into real income —
                or partner with us to hire and fund the next thousand.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="min-h-[48px] min-w-[200px]">
                  <Link
                    to={finalPrimary.to}
                    onClick={() =>
                      trackCta({
                        id: "final_cta_primary",
                        label: finalPrimary.label,
                        location: "final_cta",
                        destination: finalPrimary.to,
                        audience: "learner",
                        stage: "conversion",
                      })
                    }
                  >
                    {finalPrimary.label}
                  </Link>
                </Button>
                <DemoRequestDialog
                  location="final_cta"
                  trigger={
                    <Button variant="outline" size="lg" className="min-h-[48px] min-w-[200px]">
                      Request a demo
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <StickyMobileCta />
    </>
  );
};

export default Index;
