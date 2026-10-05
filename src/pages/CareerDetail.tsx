import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, ArrowLeft, ExternalLink, MapPin, Briefcase, Clock, ShieldCheck, FileDown,
  CalendarClock, User, Wallet, CheckCircle2, Timer, Send,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Job {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  reports_to: string | null;
  salary_band: string | null;
  salary_visible: boolean;
  contract_duration_months: number | null;
  safeguarding_level: string;
  application_mode: string;
  external_apply_url: string | null;
  summary: string | null;
  description: string | null;
  responsibilities: string | null;
  essential_criteria: string | null;
  desirable_criteria: string | null;
  posted_at: string | null;
  closes_at: string | null;
  jd_pdf_path: string | null;
  jd_pdf_name: string | null;
}

const ApplySchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  location: z.string().trim().max(120).optional(),
  cover_letter: z.string().trim().max(5000).optional(),
  portfolio_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

/** Renders admin-entered plain text, turning "-", "*" or "•" prefixed lines into a real list. */
function RichText({ text }: { text: string | null }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks: Array<{ type: "p" | "ul"; items: string[] }> = [];
  for (const line of lines) {
    const bullet = /^([-*•]|\d+[.)])\s+/.test(line);
    const content = bullet ? line.replace(/^([-*•]|\d+[.)])\s+/, "") : line;
    const last = blocks[blocks.length - 1];
    if (bullet && last?.type === "ul") last.items.push(content);
    else blocks.push({ type: bullet ? "ul" : "p", items: [content] });
  }
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="space-y-2">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-muted-foreground">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">{b.items[0]}</p>
        )
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function FactRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

const CareerDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    cover_letter: "",
    portfolio_url: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [retainFuture, setRetainFuture] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);

  const openJobDescription = async () => {
    if (!job) return;
    setJdLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("careers-jd-url", {
        body: { slug: job.slug },
      });
      if (error || !data?.url) throw new Error(data?.error ?? "Job description unavailable");
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not open the job description");
    } finally {
      setJdLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("public_job_postings")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setJob((data as Job) || null);
      setLoading(false);
    })();
  }, [slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    const parsed = ApplySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please fix the form");
      return;
    }
    if (!consent) {
      toast.error("Please consent to data processing to apply");
      return;
    }
    if (!resumeFile) {
      toast.error("Please attach your CV / resume");
      return;
    }
    if (resumeFile.size > 8 * 1024 * 1024) {
      toast.error("Resume must be 8 MB or less");
      return;
    }
    setSubmitting(true);
    try {
      const ext = resumeFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `applications/${job.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("recruitment")
        .upload(path, resumeFile, { contentType: resumeFile.type, upsert: false });
      if (upErr) throw upErr;

      // Submissions go through the backend so rate limiting is always enforced.
      const { data, error: fnErr } = await supabase.functions.invoke("careers-apply", {
        body: {
          job_posting_id: job.id,
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          location: parsed.data.location || null,
          cover_letter: parsed.data.cover_letter || null,
          portfolio_url: parsed.data.portfolio_url || null,
          resume_path: path,
          retain_for_future: retainFuture,
          consent_data_retention: true,
        },
      });
      if (data?.error) throw new Error(data.error as string);
      if (fnErr) {
        // Non-2xx responses (e.g. rate limited) carry the reason in the response body.
        let message = fnErr.message ?? "Could not submit application";
        try {
          const body = await (fnErr as any)?.context?.json?.();
          if (body?.error) message = body.error as string;
        } catch {
          /* keep the default message */
        }
        throw new Error(message);
      }

      setSubmitted(true);
      toast.success("Application submitted. Check your email for confirmation.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-4 w-28" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <div className="mb-8 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-2">Role not found</h1>
        <p className="text-muted-foreground mb-6">This vacancy may have closed.</p>
        <Button onClick={() => nav("/careers")}><ArrowLeft className="mr-2 h-4 w-4" />Back to careers</Button>
      </div>
    );
  }

  const closed = job.closes_at && new Date(job.closes_at) < new Date();
  const jobLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.summary,
    employmentType: job.employment_type.toUpperCase(),
    datePosted: job.posted_at,
    validThrough: job.closes_at,
    hiringOrganization: {
      "@type": "Organization",
      name: "Maarifasasa Limited",
      sameAs: "https://maarifasasa.com",
    },
    jobLocation: job.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "UG" } }
      : undefined,
  };

  return (
    <>
      <Helmet>
        <title>{job.title} — Careers at Maarifasasa</title>
        <meta name="description" content={job.summary ?? `Apply for ${job.title} at Maarifasasa.`} />
        <meta property="og:title" content={`${job.title} — Maarifasasa Careers`} />
        <meta property="og:description" content={job.summary ?? ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://maarifasasa.com/careers/${job.slug}`} />
        <link rel="canonical" href={`https://maarifasasa.com/careers/${job.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jobLd)}</script>
      </Helmet>

      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background pt-20 pb-8 sm:pb-10">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link to="/careers" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> All open roles
          </Link>
          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{job.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {job.department && <Badge variant="secondary"><Briefcase className="h-3 w-3 mr-1" />{job.department}</Badge>}
            {job.location && <Badge variant="secondary"><MapPin className="h-3 w-3 mr-1" />{job.location}</Badge>}
            <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{job.employment_type.replace(/_/g, " ")}</Badge>
            {job.salary_visible && job.salary_band && <Badge variant="secondary">{job.salary_band}</Badge>}
            {job.safeguarding_level !== "none" && (
              <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1" />Safeguarding role</Badge>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {job.closes_at && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 text-primary" />
                Applications close <strong className="text-foreground">{new Date(job.closes_at).toLocaleDateString()}</strong>
              </p>
            )}
            {job.jd_pdf_path && (
              <Button variant="outline" size="sm" className="w-full sm:ml-auto sm:w-auto" onClick={openJobDescription} disabled={jdLoading}>
                {jdLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Download job description (PDF)
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1fr_380px] lg:gap-10 lg:px-8">
        <article className="min-w-0 space-y-6">
          {job.summary && (
            <p className="text-base leading-relaxed text-foreground sm:text-lg">{job.summary}</p>
          )}

          <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
            <FactRow icon={Briefcase} label="Employment type" value={job.employment_type.replace(/_/g, " ")} />
            {job.location && <FactRow icon={MapPin} label="Location" value={job.location} />}
            {job.reports_to && <FactRow icon={User} label="Reports to" value={job.reports_to} />}
            {job.contract_duration_months && (
              <FactRow icon={CalendarClock} label="Contract duration" value={`${job.contract_duration_months} months`} />
            )}
            {job.salary_visible && job.salary_band && (
              <FactRow icon={Wallet} label="Salary band" value={job.salary_band} />
            )}
            {job.posted_at && (
              <FactRow icon={Clock} label="Posted" value={new Date(job.posted_at).toLocaleDateString()} />
            )}
          </div>

          {job.description && <Section title="About the role"><RichText text={job.description} /></Section>}
          {job.responsibilities && <Section title="Key responsibilities"><RichText text={job.responsibilities} /></Section>}
          {job.essential_criteria && <Section title="Essential criteria"><RichText text={job.essential_criteria} /></Section>}
          {job.desirable_criteria && <Section title="Desirable criteria"><RichText text={job.desirable_criteria} /></Section>}

          {job.safeguarding_level !== "none" && (
            <div className="rounded-xl border bg-muted/40 p-4 text-sm sm:p-5">
              <strong>Safeguarding.</strong> This role involves contact with learners. Successful
              candidates will complete a safeguarding self-declaration, police clearance and
              additional checks in line with our Recruitment & Selection Policy.
            </div>
          )}

          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground sm:p-5">
            Maarifasasa is an equal opportunity employer. We actively encourage applications from
            women, persons with disabilities and youth from underrepresented communities.
            Reasonable accommodation will be provided on request.
          </div>
        </article>

        <aside id="apply" className="min-w-0 scroll-mt-24">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="p-6">
              {closed ? (
                <p className="text-sm">Applications for this role are now closed.</p>
              ) : job.application_mode === "external_link" && job.external_apply_url ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">Apply for this role</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Applications are managed on an external platform.
                  </p>
                  <Button asChild className="w-full">
                    <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer">
                      Apply now <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </>
              ) : submitted ? (
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold mb-2">Application received ✓</h3>
                  <p className="text-sm text-muted-foreground">
                    We've emailed a confirmation. Our team will be in touch.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                  <h3 className="text-lg font-semibold">Apply for this role</h3>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="full_name">Full name *</Label>
                    <Input id="full_name" required value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" required value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="location">Current location</Label>
                    <Input id="location" value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="resume">CV / Resume (PDF, DOC) *</Label>
                    <Input id="resume" type="file" accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="portfolio">Portfolio / LinkedIn</Label>
                    <Input id="portfolio" placeholder="https://" value={form.portfolio_url}
                      onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cover">Cover letter</Label>
                    <Textarea id="cover" rows={4} value={form.cover_letter}
                      onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} />
                  </div>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
                    <span>
                      I consent to Maarifasasa processing my personal data for the purpose of this
                      application, in line with the Data Protection and Privacy Act, 2019. My data
                      will be retained for 12 months after the close of this recruitment unless I
                      opt in below.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Checkbox checked={retainFuture} onCheckedChange={(v) => setRetainFuture(!!v)} className="mt-0.5" />
                    <span>Keep my CV on file for future relevant vacancies.</span>
                  </label>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit application
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>

      {!closed && !submitted && (
        <div className="sticky bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
          <Button asChild className="w-full">
            <a href="#apply">Apply now</a>
          </Button>
        </div>
      )}
    </>
  );
};

export default CareerDetail;