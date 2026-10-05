import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Award,
  Building2,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Rocket,
  Users,
} from "lucide-react";
import TrustedBySection from "@/components/TrustedBySection";
import CourseCatalog from "@/components/academy/CourseCatalog";

const BASE_URL = "https://maarifasasa.com";

const pillars = [
  {
    icon: BookOpen,
    title: "Short courses",
    description:
      "Self-paced, mobile-friendly courses in AI, digital marketing, data, design and web development. Start in minutes, learn at your own speed.",
    href: "/learning",
    cta: "Browse courses",
  },
  {
    icon: Award,
    title: "Advanced certificates",
    description:
      "Structured certificate tracks with hands-on projects and an industry-recognised certificate you can share with employers and clients.",
    href: "/programs/certificates",
    cta: "See certificates",
  },
  {
    icon: Rocket,
    title: "Talent Accelerator",
    description:
      "A 12-week, mentor-led programme that takes you from skills to paid work — portfolio projects, employer readiness and placement support.",
    href: "/programs/talent-accelerator",
    cta: "Explore the Accelerator",
  },
];

const howItWorks = [
  { step: "1", title: "Create your account", text: "Sign up once and get instant access to your learner portal." },
  { step: "2", title: "Pick a pathway", text: "Choose a short course, a certificate track or the Talent Accelerator." },
  { step: "3", title: "Learn and build", text: "Study in the academy, complete projects and track live progress." },
  { step: "4", title: "Earn and grow", text: "Get certified, join the talent pool and start earning from your skills." },
];

const includes = [
  "One-tap sign-in to the academy",
  "Live progress tracking in your portal",
  "Certificates on completion",
  "Mobile money and card payments",
  "Mentor and community support",
  "Career and earning opportunities",
];

const Academy = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Maarifasasa Academy",
    description:
      "Maarifasasa Academy offers short courses, advanced certificates and the Talent Accelerator programme to help African youth learn skills and earn.",
    url: `${BASE_URL}/academy`,
    sameAs: BASE_URL,
  };

  return (
    <>
      <Helmet>
        <title>Maarifasasa Academy | Courses, Certificates & Accelerator</title>
        <meta
          name="description"
          content="Learn in the Maarifasasa Academy: self-paced short courses, industry-recognised certificates and the 12-week Talent Accelerator that turns skills into income."
        />
        <link rel="canonical" href={`${BASE_URL}/academy`} />
        <meta property="og:title" content="Maarifasasa Academy | Courses, Certificates & Accelerator" />
        <meta
          property="og:description"
          content="Short courses, advanced certificates and the 12-week Talent Accelerator — learn skills that pay."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/academy`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                <GraduationCap className="w-4 h-4 mr-2" />
                Maarifasasa Academy
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Knowledge now. <span className="text-primary">Opportunity everywhere.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                One academy, three ways to grow: short courses to build a skill, certificates to prove
                it, and the Talent Accelerator to turn it into income.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <a href="#catalog">
                    Browse the course catalog <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth?tab=signup">Create your free account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <CourseCatalog />


        {/* Pillars */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              What you can study
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Every pathway lives inside the same academy account, so your progress, certificates and
              payments stay in one place.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {pillars.map((p) => (
                <Card key={p.title} className="flex flex-col">
                  <CardHeader>
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{p.title}</CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button variant="ghost" className="px-0" asChild>
                      <Link to={p.href}>
                        {p.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-muted/40">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How the academy works</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((s) => (
                <div key={s.step} className="rounded-lg border bg-background p-6">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Includes */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything included</h2>
              <p className="text-muted-foreground mb-6">
                Your learner portal keeps your courses, live progress, receipts and certificates
                together — with one-tap sign-in to the academy.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Built for African talent
                </CardTitle>
                <CardDescription>
                  We are on a mission to unlock 1 million jobs by 2030 — training youth in the skills
                  employers and the digital economy actually pay for.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/auth?tab=signup">Create your free account</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/advisor">Not sure where to start? Ask the advisor</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Organisations / partners */}
        <section className="py-16 md:py-20 bg-muted/40">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-primary/20">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="p-8 md:p-10">
                  <Badge variant="secondary" className="mb-4">
                    <Building2 className="w-4 h-4 mr-2" /> For organisations
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Training a team? Track every learner in one place.
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Sponsor a cohort of learners and we set up a private group for your organisation.
                    Your own portal shows who has started, how far they have progressed and what they
                    have completed — and you can export the numbers for reporting any time.
                  </p>
                  <ul className="grid gap-3 mb-8">
                    {[
                      "A private group for your sponsored learners",
                      "Live progress and completion tracking",
                      "One secure login for your team leads",
                      "Exportable reports for funders and partners",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" asChild>
                      <Link to="/organisation-portal">
                        Open the organisation portal <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link to="/contact">Talk to us about group training</Link>
                    </Button>
                  </div>
                </div>
                <div className="bg-primary/5 p-8 md:p-10 flex flex-col justify-center gap-6">
                  <div>
                    <div className="text-4xl font-bold text-primary">1</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share your learner list — we onboard everyone into your group.
                    </p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary">2</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your team lead gets portal access linked to that group only.
                    </p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary">3</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Follow progress, completions and certificates as learning happens.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <TrustedBySection />

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of learners building skills that pay in the Maarifasasa Academy.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?tab=signup">
                Start Learning to Earn <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Academy;
