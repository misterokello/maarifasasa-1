import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Gift,
  Server,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TrustedBySection from "@/components/TrustedBySection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackEnquirySubmit } from "@/lib/analytics";
import partnersHero from "@/assets/partners-mou-signing.png.asset.json";

const BASE_URL = "https://maarifasasa.com";

const PARTNER_TYPES = [
  {
    id: "employer",
    icon: Briefcase,
    title: "Employers & BPOs",
    copy: "Hire vetted, job-ready digital talent — or build a dedicated delivery team.",
    actions: [
      "Talent requests scoped in 48 hours",
      "Pre-vetted candidates with verified portfolios",
      "Custom upskilling for your tech stack",
    ],
  },
  {
    id: "funder",
    icon: Gift,
    title: "Funders & foundations",
    copy: "Fund an outcomes-based model with transparent learner-level reporting.",
    actions: [
      "Cost-per-outcome programme design",
      "Monitoring, evaluation & learning dashboards",
      "Co-branded cohorts in target districts",
    ],
  },
  {
    id: "government",
    icon: Building2,
    title: "Governments & agencies",
    copy: "Co-deliver national youth employment and digital-economy priorities.",
    actions: [
      "District and national cohort rollouts",
      "Curriculum aligned to policy frameworks",
      "Public reporting on placements and earnings",
    ],
  },
  {
    id: "technology",
    icon: Server,
    title: "Technology partners",
    copy: "Put your tools, cloud credits and certifications in front of AI-ready talent.",
    actions: [
      "Certification pathways inside our LMS",
      "Developer community activations",
      "Co-marketing to 10,000+ learners",
    ],
  },
  {
    id: "investor",
    icon: TrendingUp,
    title: "Investors",
    copy: "Back the talent-infrastructure layer of Africa's digital economy.",
    actions: [
      "Data room and unit economics on request",
      "Growth roadmap to 1,000,000 opportunities",
      "Direct time with the founding team",
    ],
  },
  {
    id: "affiliate",
    icon: Users,
    title: "Referral partners",
    copy: "Earn commission on every learner who enrols through your link or code.",
    actions: [
      "Personal discount code and dashboard",
      "Transparent commission tracking",
      "Paid out per verified enrolment",
    ],
  },
];

const Partners = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    organisation: "",
    type: "employer",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      toast({
        title: "Tell us a little more",
        description: "Please add at least a sentence about what you need.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const label = PARTNER_TYPES.find((t) => t.id === form.type)?.title ?? form.type;
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: form.name,
          email: form.email,
          subject: `Partnership enquiry — ${label}`,
          message: `Organisation: ${form.organisation || "Not provided"}\nPartner type: ${label}\n\n${form.message}`,
        },
      });
      if (error) throw error;
      trackEnquirySubmit({
        form: "partner_enquiry",
        audience: "enterprise",
        status: "success",
        extra: { partner_type: form.type },
      });
      toast({
        title: "Enquiry sent",
        description: "Our partnerships team will be in touch within two business days.",
      });
      setForm({ name: "", email: "", organisation: "", type: form.type, message: "" });
    } catch (err) {
      trackEnquirySubmit({
        form: "partner_enquiry",
        audience: "enterprise",
        status: "error",
        extra: { partner_type: form.type },
      });
      toast({
        title: "Could not send your enquiry",
        description: err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Partner With Maarifasasa | Hire African Digital Talent</title>
        <meta
          name="description"
          content="Hire vetted African digital talent, fund outcomes-based skilling, or co-deliver national digital programmes with Maarifasasa."
        />
        <link rel="canonical" href={`${BASE_URL}/partners`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/partners`} />
        <meta property="og:title" content="Partner With Maarifasasa | Hire African Digital Talent" />
        <meta
          property="og:description"
          content="A reliable pipeline of verified, job-ready African digital talent — with the reporting partners require."
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary/40 py-20 lg:py-28">
          <div className="absolute right-[8%] top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-3xl">
                <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  Partnerships
                </span>
                <h1 className="heading-xl">Africa&apos;s digital workforce engine, built with partners</h1>
                <p className="mt-6 text-xl text-muted-foreground">
                  We train, verify and place African digital talent. Partner with us to hire it, fund
                  it, scale it or take it to market.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button asChild size="lg" className="group min-h-[48px]">
                    <a href="#partner-enquiry">
                      Start a conversation
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-h-[48px]">
                    <Link to="/partners/apply">Become a referral partner</Link>
                  </Button>
                </div>

                <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {[
                    { v: "10,000+", l: "Learners trained" },
                    { v: "~2,000", l: "Verified placements" },
                    { v: "UGX 1.2B", l: "Earned by talent yearly" },
                    { v: "95%", l: "Completion rate" },
                  ].map((s) => (
                    <div key={s.l}>
                      <dt className="text-2xl font-bold">{s.v}</dt>
                      <dd className="text-sm text-muted-foreground">{s.l}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <figure className="relative">
                <img
                  src={partnersHero.url}
                  alt="Maarifasasa leadership signing a memorandum of understanding with Toro Kingdom to establish a digital impact hub"
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-2xl border border-border object-cover shadow-lg"
                />
                <figcaption className="mt-3 text-sm text-muted-foreground">
                  Signing the MoU with Toro Kingdom for a new digital impact hub.
                </figcaption>
              </figure>
            </div>
          </div>

        </section>

        {/* Partner types */}
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="heading-lg">Choose your door in</h2>
              <p className="mt-3 text-muted-foreground">
                Every partnership is scoped around measurable outcomes — placements, earnings and
                verified skills.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PARTNER_TYPES.map((type) => (
                <Card key={type.id} className="hover-lift flex h-full flex-col border-border">
                  <CardContent className="flex h-full flex-col p-6">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <type.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mb-2 text-lg font-semibold">{type.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{type.copy}</p>
                    <ul className="mb-6 space-y-2">
                      {type.actions.map((action) => (
                        <li key={action} className="flex items-start gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    {type.id === "affiliate" ? (
                      <Button asChild variant="outline" className="mt-auto min-h-[44px] w-full">
                        <Link to="/partners/apply">Apply as a referral partner</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="mt-auto min-h-[44px] w-full"
                        onClick={() => {
                          setForm((f) => ({ ...f, type: type.id }));
                          document
                            .getElementById("partner-enquiry")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Talk to our team
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <TrustedBySection variant="dark" />

        {/* Enquiry form */}
        <section id="partner-enquiry" className="section-padding bg-secondary/40 scroll-mt-24">
          <div className="container mx-auto">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2">
              <div>
                <h2 className="heading-lg mb-4">Tell us what you need</h2>
                <p className="mb-6 text-muted-foreground">
                  Share a few details and our partnerships team will respond within two business
                  days with a scoped proposal or a call invite.
                </p>
                <ul className="space-y-3 text-sm text-foreground/80">
                  {[
                    "Talent requests: roles, volume, timeline",
                    "Programme funding: geography, cohort size, outcomes",
                    "Technology & certification collaborations",
                    "Investor materials and data room access",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner-name">Full name</Label>
                      <Input
                        id="partner-name"
                        required
                        maxLength={100}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-email">Work email</Label>
                      <Input
                        id="partner-email"
                        type="email"
                        required
                        maxLength={255}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-org">Organisation</Label>
                      <Input
                        id="partner-org"
                        maxLength={150}
                        value={form.organisation}
                        onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-type">Partnership type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(value) => setForm({ ...form, type: value })}
                      >
                        <SelectTrigger id="partner-type">
                          <SelectValue placeholder="Select a partnership type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTNER_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner-message">What are you looking for?</Label>
                      <Textarea
                        id="partner-message"
                        required
                        rows={5}
                        maxLength={5000}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="min-h-[48px] w-full" disabled={submitting}>
                      {submitting ? "Sending…" : "Send enquiry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Partners;
