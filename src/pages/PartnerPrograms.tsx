import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';
import { formatUSD, generateCheckoutLink } from '@/lib/api/products';
import { ArrowRight, Building2, Handshake, Globe } from 'lucide-react';

const PartnerPrograms = () => {
  const navigate = useNavigate();
  const [partnerCourses, setPartnerCourses] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'program')
        .eq('program_type', 'partner_program')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load partner programs:', error);
      }
      setPartnerCourses(((data || []) as any[]).map((p) => p as Product));
      setLoading(false);
    })();
  }, []);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: partnerCourses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.name,
        description: course.description || undefined,
        provider: {
          '@type': 'Organization',
          name: 'Maarifasasa',
        },
        offers: {
          '@type': 'Offer',
          price: course.price_usd,
          priceCurrency: 'USD',
        },
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Maarifasasa Partner Programs | Courses by Industry Partners</title>
        <meta
          name="description"
          content="Explore curated Maarifasasa partner programs designed with employers and development partners to build job-ready skills."
        />
        <meta property="og:title" content="Maarifasasa Partner Programs | Courses by Industry Partners" />
        <meta property="og:description" content="Explore curated Maarifasasa partner programs designed with employers and development partners." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Maarifasasa Partner Programs" />
        <meta name="twitter:description" content="Courses built with industry and development partners to unlock earning opportunities." />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-28">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Handshake className="h-4 w-4" />
                <span className="text-sm font-medium">Built with partners</span>
              </div>

              <h1 className="heading-xl mb-6 text-foreground">
                Partner Programs
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Curated courses and learning experiences developed with employers,
                governments, and development partners to fast-track your career.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="outline" className="hover-lift text-lg px-8 py-6">
                  <Link to="/programs/talent-accelerator">
                    View Talent Accelerator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Programs Grid */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Open partner programs</h2>
                <p className="text-lg text-muted-foreground">
                  Enroll in a partner-led course and gain skills that employers are looking for.
                </p>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="border-border animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-16 bg-muted rounded" />
                        <div className="h-8 bg-muted rounded w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : partnerCourses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partnerCourses.map((course) => (
                    <Card key={course.id} className="hover-lift border-border flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-start gap-2">
                          <Building2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <span>{course.name}</span>
                        </CardTitle>
                        {course.duration && (
                          <p className="text-sm text-muted-foreground">{course.duration}</p>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between gap-4">
                        {course.description ? (
                          <p className="text-muted-foreground text-sm line-clamp-4">
                            {course.description}
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-sm italic">
                            No description available.
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-primary">
                            {formatUSD(course.price_usd)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => navigate(generateCheckoutLink(course.slug))}
                          >
                            Enroll
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No open partner programs right now
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    New partner programs are added regularly. In the meantime, explore our flagship
                    Talent Accelerator to fast-track your career.
                  </p>
                  <Button asChild>
                    <Link to="/programs/talent-accelerator">
                      Explore Talent Accelerator
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PartnerPrograms;
