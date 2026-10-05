import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Users, GraduationCap, Globe, Briefcase, Target, Award, ChevronRight, Heart, Lightbulb, Star, MapPin, BookOpen, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrustedBySection from "@/components/TrustedBySection";

const BASE_URL = "https://maarifasasa.com";

const About = () => {
  const pageTitle = "About Maarifasasa | Pan-African Workforce Development";
  const pageDescription = "A Pan-African workforce development and BPO company on a mission to unlock 1 million earning opportunities for young Africans in the digital economy by 2030.";
  const pageImage = `${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Maarifasasa",
      "url": BASE_URL,
      "logo": `${BASE_URL}/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png`,
      "description": pageDescription,
      "sameAs": [
        "https://www.linkedin.com/company/maarifasasa",
        "https://twitter.com/maarifasasa"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Lira",
        "addressCountry": "Uganda"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Maarifasasa",
      "url": BASE_URL
    }
  ];

  return <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${BASE_URL}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/about`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/about`} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <main className="pt-16 overflow-hidden">
        {/* Hero Section - Clean with orange accent */}
        <section className="relative py-20 md:py-28 bg-background overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-primary/20 animate-pulse hidden md:block"></div>
          <div className="absolute top-40 right-32 w-8 h-8 rounded-full bg-primary hidden md:block"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full border-4 border-primary/30 hidden md:block"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
                  About Maarifasasa
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Knowledge <span className="text-primary">Now.</span><br />
                  Opportunity <span className="text-primary">Everywhere.</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  A Pan-African workforce development and BPO company on a mission to unlock 
                  <span className="font-semibold text-foreground"> 1 million earning opportunities </span> 
                  for young Africans in the digital economy by 2030.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
                    <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                      Start Learning to Earn
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-2">
                    <Link to="/contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/lovable-uploads/2bc0d18b-223a-4c2e-a873-d0c0d8646e4d.png" alt="African students working with computers" className="w-full h-auto" />
                </div>
                {/* Floating Stats Cards */}
                <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-lg p-4 border border-border hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">10K+</p>
                      <p className="text-sm text-muted-foreground">Youths Trained</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-card rounded-xl shadow-lg p-4 border border-border hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">1M</p>
                      <p className="text-sm text-muted-foreground">2030 target</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-8 bg-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-6 w-6 text-primary-foreground/80" />
                  <p className="text-3xl md:text-4xl font-bold text-primary-foreground">10,000+</p>
                </div>
                <p className="text-primary-foreground/80 text-sm">Youths Trained</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary-foreground/80" />
                  <p className="text-3xl md:text-4xl font-bold text-primary-foreground">2,000+</p>
                </div>
                <p className="text-primary-foreground/80 text-sm">Freelancers Launched</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Award className="h-6 w-6 text-primary-foreground/80" />
                  <p className="text-3xl md:text-4xl font-bold text-primary-foreground">80%</p>
                </div>
                <p className="text-primary-foreground/80 text-sm">Employment Rate</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Globe className="h-6 w-6 text-primary-foreground/80" />
                  <p className="text-3xl md:text-4xl font-bold text-primary-foreground">1M</p>
                </div>
                <p className="text-primary-foreground/80 text-sm">Countries Reached</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <TrustedBySection variant="light" />

        {/* Our Story Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src="/lovable-uploads/58928ad6-b263-4564-9df1-f54365aba727.jpg" alt="Founder Robert Bob Okello" className="w-full h-auto rounded-2xl shadow-xl" />
                </div>
                {/* Quote Card */}
                <div className="absolute -bottom-8 -right-8 bg-card rounded-xl shadow-xl p-6 max-w-xs border border-border hidden lg:block">
                  <p className="text-muted-foreground italic text-sm leading-relaxed">
                    "Talent is everywhere, but opportunity is not. That insight became the foundation of Maarifasasa."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Robert Bob Okello</p>
                      <p className="text-xs text-muted-foreground">Founder & CEO</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-primary font-medium uppercase tracking-wider text-sm">Our Story</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  From a Village in Uganda to a Pan-African Movement
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    At the heart of Maarifasasa is Robert Bob Okello, a visionary founder whose life journey embodies the urgency and hope our name represents. Born and raised in Barlwala, a small village in northern Uganda, Bob's early life was shaped by economic hardship and limited access to opportunity.
                  </p>
                  <p>
                    At one point, he nearly dropped out of school after Primary Seven due to financial barriers, but his determination and academic excellence earned him scholarships that took him from rural Uganda to United World College in Norway and later to the University of Oklahoma.
                  </p>
                  <p>
                    Bob's journey taught him something profound: <span className="font-semibold text-foreground">talent is everywhere, but opportunity is not.</span> That insight became the foundation of Maarifasasa.
                  </p>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Maarifasasa means "Knowledge Now"</p>
                      <p className="text-sm text-muted-foreground">Swahili for urgency in equipping youth with digital skills</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-20 md:py-28 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-primary font-medium uppercase tracking-wider text-sm mb-4">What We Do</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Practical, Future-Ready Learning Experiences
              </h2>
              <p className="text-lg text-muted-foreground">
                We integrate skills development with earnings pathways, offering mentorship, hands-on project experience, and direct links to global opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Digital Skills Training</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    From digital marketing and virtual assistance to customer support and digital entrepreneurship.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Briefcase className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Earnings Pathways</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Remote work, freelance roles, BPO opportunities, and entrepreneurship — we connect you to real income.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Mentorship & Support</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Guidance from experienced professionals with real-world insights and personalized support.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Inclusive Focus</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Special focus on rural youth, women, and other historically marginalized groups across Africa.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Digital Impact Hubs</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Expanding network of learning centers bringing opportunity directly to communities.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift h-full bg-card border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Award className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Shared Success Model</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We only succeed when our learners begin to earn. Your success is our mission.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <p className="text-primary font-medium uppercase tracking-wider text-sm">Our Vision</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  African Youth Leading the Global Digital Economy
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We envision a future where African youth are not left behind by the global digital economy but are <span className="font-semibold text-foreground">leading it</span>.
                  </p>
                  <p>
                    A future where young Africans have the skills, confidence, and platforms to build meaningful digital careers, create businesses that scale, and contribute to their communities.
                  </p>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">1 Million Opportunities by 2030</p>
                      <p className="text-sm text-muted-foreground">Unlocking earning potential for Africa's youth</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Rocket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">From Learning to Earning</p>
                      <p className="text-sm text-muted-foreground">Real pathways, not just certificates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Pan-African Reach</p>
                      <p className="text-sm text-muted-foreground">Uganda, Ghana, Eswatini, Lesotho, and growing</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img alt="African youth in digital economy" className="w-full h-auto" src="/lovable-uploads/a9fec6d9-0cef-4ab4-b323-43b856e36551.jpg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why It Matters Section */}
        <section className="py-20 md:py-28 bg-foreground text-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-primary font-medium uppercase tracking-wider text-sm mb-4">Why It Matters</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Africa's Greatest Wealth is Its People
              </h2>
              <div className="space-y-6 text-lg text-muted leading-relaxed">
                <p>
                  Africa is home to the world's youngest population and a rapidly growing digital landscape. Yet millions of young people remain unemployed or underemployed, with barriers to quality education and global earning opportunities.
                </p>
                <p>
                  Maarifasasa exists to change that narrative by equipping youth with the skills, networks, and pathways they need to thrive in the digital age.
                </p>
              </div>
              <div className="mt-12">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-6 text-lg">
                  <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                    Join the Movement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <p className="mt-6 text-muted text-sm">
                  Join us in building a future where Knowledge Now leads to prosperity everywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Preview */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-primary font-medium uppercase tracking-wider text-sm mb-4">Success Stories</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Real People, Real Results
              </h2>
              <p className="text-lg text-muted-foreground">
                These stories speak to our core aim: giving every learner the tools, confidence, and real-world experiences to thrive.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="overflow-hidden h-full hover-lift border-0 shadow-lg">
                <div className="h-48 bg-gradient-to-b from-primary/10 to-secondary flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg">
                    <img src="/lovable-uploads/13243b3c-7439-459e-8a28-95c1d2629299.png" alt="Nelisiwe Dlamini" className="w-full h-full object-cover" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-lg text-foreground">Nelisiwe Dlamini</h4>
                    <p className="text-sm text-muted-foreground">Virtual Assistance Graduate</p>
                  </div>
                  <blockquote className="text-muted-foreground text-center italic text-sm">
                    "My experience has been exceptional. The courses are well-structured and comprehensive."
                  </blockquote>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden h-full hover-lift border-0 shadow-lg">
                <div className="h-48 bg-gradient-to-b from-primary/10 to-secondary flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg">
                    <img src="/lovable-uploads/8c658b2d-4dfe-4c40-9dd1-4636ec3c729b.png" alt="Paul Dosumu" className="w-full h-full object-cover" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-lg text-foreground">Paul Dosumu</h4>
                    <p className="text-sm text-muted-foreground">Virtual Assistant Graduate</p>
                  </div>
                  <blockquote className="text-muted-foreground text-center italic text-sm">
                    "Maarifasasa opened new worlds for me. I met a diverse community of learners and mentors."
                  </blockquote>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden h-full hover-lift border-0 shadow-lg">
                <div className="h-48 bg-gradient-to-b from-primary/10 to-secondary flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg">
                    <img src="/lovable-uploads/b89be8f2-ecef-4a2e-bdf8-d1f9d9545cec.png" alt="Thapelo Moleleki" className="w-full h-full object-cover" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-lg text-foreground">Thapelo Moleleki</h4>
                    <p className="text-sm text-muted-foreground">Digital Marketing Graduate</p>
                  </div>
                  <blockquote className="text-muted-foreground text-center italic text-sm">
                    "Maarifasasa helped me transition from traditional work to the digital economy."
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>;
};
export default About;