import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award, CheckCircle2 } from "lucide-react";
import TrustedBySection from "@/components/TrustedBySection";
import CertificatesGrid from "@/components/certificates/CertificatesGrid";
const BASE_URL = "https://maarifasasa.com";
const outcomes = ["Industry-recognized certificates", "Practical, hands-on projects", "Self-paced learning", "Expert-led instruction", "Lifetime access to materials", "Career support resources"];
const AdvancedCertificates = () => {
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Maarifasasa Advanced Certificates",
    "description": "Industry-recognized certificate courses in AI, Digital Marketing, Web Development and more. Self-paced, practical, and affordable.",
    "provider": {
      "@type": "Organization",
      "name": "Maarifasasa",
      "sameAs": BASE_URL
    },
    "url": `${BASE_URL}/programs/advanced-certificates`,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "PT20H"
    },
    "offers": {
      "@type": "Offer",
      "price": "35000",
      "priceCurrency": "UGX",
      "category": "Paid",
      "availability": "https://schema.org/InStock"
    }
  };
  return <>
      <Helmet>
        <title>Advanced Certificates | Maarifasasa</title>
        <meta name="description" content="Earn industry-recognized certificates in AI, Digital Marketing, Web Development, and more. Starting from UGX 20,000 per course." />
        <meta property="og:title" content="Advanced Certificates | Maarifasasa" />
        <meta property="og:description" content="Earn industry-recognized certificates in AI, Digital Marketing, Web Development, and more. Starting from UGX 20,000 per course." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:url" content={`${BASE_URL}/programs/advanced-certificates`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify(courseSchema)}</script>
      </Helmet>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                <Award className="w-4 h-4 mr-2" />
                Starting from UGX 20,000
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Advanced <span className="text-primary">Certificates</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Earn industry-recognized certificates in high-demand skills. 
                Affordable, practical, and designed for the African job market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group">
                  <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                    Start Learning to Earn
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://wa.me/message/HOQFQPM6SGU3O1" target="_blank" rel="noopener noreferrer">Talk to Us</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <div className="bg-primary text-primary-foreground py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-center">
              <div>
                <span className="font-bold text-2xl">5,000+</span>
                <span className="ml-2 text-primary-foreground/80">Certificates Issued</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-primary-foreground/30"></div>
              <div>
                <span className="font-bold text-2xl">10+</span>
                <span className="ml-2 text-primary-foreground/80">Course Topics</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-primary-foreground/30"></div>
              <div>
                <span className="font-bold text-2xl">Self-Paced</span>
                <span className="ml-2 text-primary-foreground/80">Learning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <TrustedBySection variant="light" />

        {/* Certificates Grid */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Available Certificates
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose from our range of certificate courses designed to boost your career and earning potential.
              </p>
            </div>

            <CertificatesGrid />
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="mb-4">Program Benefits</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  What You Get
                </h2>
                <p className="text-muted-foreground mb-8">
                  Our certificate programs are designed to give you practical skills 
                  and recognized credentials that employers and clients value.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {outcomes.map((outcome, index) => <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{outcome}</span>
                    </div>)}
                </div>
              </div>
              <div className="bg-card rounded-2xl p-8 border shadow-lg">
                <div className="text-center">
                  <Badge className="mb-4 bg-primary/10 text-primary border-0">
                    Best Value
                  </Badge>
                  <h3 className="text-2xl font-bold mb-2">Certificate Course</h3>
                  <div className="mb-6">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <div className="text-4xl font-bold text-primary">UGX 35,000</div>
                    <span className="text-sm text-muted-foreground">per course</span>
                  </div>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Full course access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Certificate upon completion</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Practical projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Community access</span>
                    </li>
                  </ul>
                  <Button asChild size="lg" className="w-full group">
                    <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                      Enroll Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Certified?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have earned their certificates 
              and unlocked new earning opportunities.
            </p>
            <Button asChild size="lg" variant="secondary" className="group">
              <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                Start Learning to Earn
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </>;
};
export default AdvancedCertificates;