import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CourseOutline } from "@/components/checkout/CourseOutline";
import { CourseBenefits } from "@/components/checkout/CourseBenefits";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Clock,
  GraduationCap,
  Quote,
  Star,
  Users,
} from "lucide-react";
import type { Product, ProductCategory } from "@/types/product";

const BASE_URL = "https://maarifasasa.com";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  certificate: "Advanced certificate",
  bootcamp: "Bootcamp",
  program: "Programme",
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

interface Lesson {
  name: string;
  content_type?: string | null;
}

interface CourseDetail {
  name?: string;
  subtitle?: string | null;
  description?: string | null;
  course_card_image_url?: string | null;
  banner_image_url?: string | null;
  chapters?: { name: string; contents_count: number; lessons?: Lesson[] }[];
  user_count?: number;
  course_card_text?: string | null;
  keywords?: string | null;
  instructional_level?: string | null;
  duration?: string | null;
  instructor?: { name?: string | null; title?: string | null; bio?: string | null; avatar_url?: string | null } | null;
  reviews?: { rating?: number | null; text: string; author: string; created_at?: string | null }[];
}

function stripHtml(html?: string | null): string {
  if (!html) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Product | null) ?? null;
}

const CourseDetailPage = () => {
  const { slug = "" } = useParams();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["academy-product", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const courseId = product?.thinkific_course_id;
    if (!courseId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setDetailLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/thinkific-course-detail?course_id=${courseId}`,
        );
        if (res.ok && !cancelled) setDetail(await res.json());
      } catch (err) {
        console.warn("[CourseDetail] course detail fetch failed", err);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [product?.thinkific_course_id]);

  const chapters = detail?.chapters ?? [];
  const totalLessons = chapters.reduce((sum, c) => sum + (c.contents_count || 0), 0);
  const reviews = detail?.reviews ?? [];
  const instructor = detail?.instructor;
  const heroImage = detail?.banner_image_url || detail?.course_card_image_url || null;
  const longDescription = stripHtml(detail?.description) || product?.description || "";
  const start = formatDate(product?.start_date ?? null);

  const faqs = product
    ? [
        {
          q: "How do I enroll and pay?",
          a: `Click “Start Learning to Earn”, create or sign in to your Maarifasasa account, then pay with mobile money (${formatUGX(
            product.price_ugx,
          )}) or card (${formatUSD(product.price_usd)}). Your seat is created in the academy automatically.`,
        },
        {
          q: "How long do I have access?",
          a: `${product.duration ? `The programme runs for ${product.duration}. ` : ""}You keep access to your course materials in the academy and can learn at your own pace from any device.`,
        },
        {
          q: "Do I get a certificate?",
          a: "Yes. Once you complete all required lessons and assessments, your certificate is issued in the academy and shows up in your learner dashboard.",
        },
        {
          q: "What do I need to get started?",
          a: "A smartphone or laptop and an internet connection. All lessons are mobile-friendly and can be studied in short sessions.",
        },
        {
          q: "Is there mentor support?",
          a: "Yes. You get mentor and community support throughout, plus career guidance to help you turn your new skills into income.",
        },
        {
          q: "Can I pay in instalments?",
          a: "Selected programmes, including the Talent Accelerator, allow a 50% initial payment at checkout. Instalment options appear on the checkout page when available.",
        },
      ]
    : [];

  const schema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        name: product.name,
        description: longDescription.slice(0, 300),
        url: `${BASE_URL}/academy/${product.slug}`,
        provider: {
          "@type": "EducationalOrganization",
          name: "Maarifasasa Academy",
          url: BASE_URL,
        },
        offers: {
          "@type": "Offer",
          price: product.price_usd,
          priceCurrency: "USD",
          url: `${BASE_URL}/checkout?product=${product.slug}`,
          availability: "https://schema.org/InStock",
        },
        ...(instructor?.name
          ? { instructor: { "@type": "Person", name: instructor.name, description: stripHtml(instructor.bio) } }
          : {}),
      }
    : null;

  const faqSchema =
    product && faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-28 space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="container mx-auto px-4 py-28 text-center">
          <h1 className="text-3xl font-bold mb-3">Course not found</h1>
          <p className="text-muted-foreground mb-6">
            This course may have been unpublished. Browse the full catalog to find your next course.
          </p>
          <Button asChild>
            <Link to="/academy">Back to the catalog</Link>
          </Button>
        </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${product.name.slice(0, 45)} | Maarifasasa Academy`}</title>
        <meta
          name="description"
          content={(longDescription || `Enroll in ${product.name} at Maarifasasa Academy.`).slice(0, 155)}
        />
        <link rel="canonical" href={`${BASE_URL}/academy/${product.slug}`} />
        <meta property="og:title" content={`${product.name} | Maarifasasa Academy`} />
        <meta
          property="og:description"
          content={(longDescription || `Enroll in ${product.name} at Maarifasasa Academy.`).slice(0, 155)}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>


      <main className="pt-24">
        {/* Hero */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <Link
              to="/academy"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to catalog
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="secondary">{CATEGORY_LABELS[product.category] ?? product.category}</Badge>
                  {product.program_type === "talent_accelerator" && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Talent Accelerator</Badge>
                  )}
                  {detail?.instructional_level && <Badge variant="outline">{detail.instructional_level}</Badge>}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                {(detail?.subtitle || product.description) && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {detail?.subtitle || product.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                  {(product.duration || detail?.duration) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {product.duration || detail?.duration}
                    </span>
                  )}
                  {start && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" /> Starts {start}
                    </span>
                  )}
                  {totalLessons > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> {totalLessons} lessons
                    </span>
                  )}
                  {!!detail?.user_count && detail.user_count > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> {detail.user_count.toLocaleString()} learners
                    </span>
                  )}
                </div>
              </div>

              {/* Enrol card */}
              <Card className="overflow-hidden lg:sticky lg:top-28">
                {heroImage && (
                  <img
                    src={heroImage}
                    alt={`${product.name} course artwork`}
                    loading="lazy"
                    className="h-44 w-full object-cover bg-muted"
                  />
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">{formatUGX(product.price_ugx)}</p>
                    <p className="text-sm text-muted-foreground">or {formatUSD(product.price_usd)}</p>
                  </div>
                  <Button className="w-full" size="lg" asChild>
                    <Link to={`/checkout?product=${product.slug}`}>Start Learning to Earn</Link>
                  </Button>
                  <Separator />
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Certificate on completion
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Learn at your own pace
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Mentor & community support
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-12">
            {/* About */}
            {longDescription && (
              <section>
                <h2 className="text-2xl font-bold mb-4">About this course</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{longDescription}</p>
              </section>
            )}

            {/* What you get */}
            <CourseBenefits
              description={detail?.description}
              cardText={detail?.course_card_text}
              keywords={detail?.keywords}
              instructionalLevel={detail?.instructional_level}
              duration={product.duration || detail?.duration}
              totalLessons={totalLessons}
            />

            {/* Syllabus */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Syllabus</h2>
              {detailLoading && <Skeleton className="h-40 w-full" />}
              {!detailLoading && chapters.length > 0 && <CourseOutline chapters={chapters} />}
              {!detailLoading && chapters.length === 0 && (
                <p className="text-muted-foreground">
                  The detailed syllabus for this {CATEGORY_LABELS[product.category]?.toLowerCase() ?? "course"} is
                  shared with you in the academy as soon as you enroll.
                </p>
              )}
            </section>

            {/* Instructor */}
            {instructor?.name && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Your instructor</h2>
                <Card>
                  <CardContent className="p-6 flex flex-col sm:flex-row gap-5">
                    {instructor.avatar_url ? (
                      <img
                        src={instructor.avatar_url}
                        alt={instructor.name}
                        loading="lazy"
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{instructor.name}</h3>
                      {instructor.title && (
                        <p className="text-sm text-muted-foreground mb-2">{instructor.title}</p>
                      )}
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {stripHtml(instructor.bio) ||
                          `${instructor.name} leads this course in the Maarifasasa Academy, combining hands-on industry practice with practical, job-focused teaching.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Testimonials */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">What learners say</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {reviews.map((r, i) => (
                    <Card key={i} className="h-full">
                      <CardContent className="p-6">
                        {typeof r.rating === "number" && (
                          <div className="flex gap-0.5 mb-3" aria-label={`${r.rating} out of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${s <= (r.rating || 0) ? "fill-primary text-primary" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        )}
                        <div className="relative">
                          <Quote className="absolute -top-2 -left-1 h-6 w-6 text-primary/20" />
                          <blockquote className="pl-6 text-sm text-muted-foreground">{stripHtml(r.text)}</blockquote>
                        </div>
                        <p className="mt-4 text-sm font-medium">{r.author}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Closing CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">Ready to start {product.name}?</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to={`/checkout?product=${product.slug}`}>Start Learning to Earn</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/academy">Compare other courses</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <aside className="hidden lg:block" />
        </div>
      </main>

    </>
  );
};

export default CourseDetailPage;
