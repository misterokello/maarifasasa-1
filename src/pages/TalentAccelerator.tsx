import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';
import { formatUSD, generateCheckoutLink } from '@/lib/api/products';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Briefcase, 
  Award,
  Target,
  GraduationCap,
  Lightbulb,
  Code,
  Palette,
  ShoppingCart,
  Megaphone,
  Clock,
  FileText,
  UserCheck,
  DollarSign,
  ArrowRight,
  Globe,
  Building2,
  Laptop,
  Wifi,
  Calendar,
  MessageCircle,
  Zap,
  Star,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TalentAccelerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSticky, setIsSticky] = useState(false);
  const [taCourses, setTaCourses] = useState<Product[]>([]);
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    track: '',
    country: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analytics event tracking
  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName);
    }
    console.log(`Analytics event: ${eventName}`);
  };

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Talent Accelerator programs from the products table
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'program')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load talent accelerator courses:', error);
        return;
      }
      const filtered = ((data || []) as any[]).filter(
        (p) => p.program_type === 'talent_accelerator'
      );
      setTaCourses(filtered as Product[]);
    })();
  }, []);

  const handleStartAudit = () => {
    trackEvent('click_start_audit');
    navigate('/checkout?product=talent-accelerator');
  };

  const handleViewDetails = () => {
    trackEvent('click_view_details');
    const element = document.getElementById('what-is-accelerator');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    trackEvent('submit_lead_form');
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Thanks! We'll be in touch.",
      description: "We will share cohort details and the audit link.",
    });
    
    setLeadForm({ fullName: '', email: '', whatsapp: '', track: '', country: '' });
    setIsSubmitting(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Maarifasasa Talent Accelerator",
    "description": "A 12-week hands-on program that builds real portfolio projects and connects top performers to paid opportunities.",
    "provider": {
      "@type": "Organization",
      "name": "Maarifasasa"
    },
    "offers": {
      "@type": "Offer",
      "price": "200",
      "priceCurrency": "USD"
    }
  };

  const problemPoints = [
    "You completed online courses but have nothing to show employers",
    "You have skills but no portfolio, references, or proof of delivery",
    "You applied to dozens of jobs but get ignored or rejected",
    "You don't know how to price yourself or find paying clients"
  ];

  const acceleratorFeatures = [
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Real Projects",
      description: "Work on actual client briefs and build portfolio pieces that prove your ability to deliver."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Mentorship",
      description: "Get weekly guidance from industry practitioners who have built careers in your track."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Team Delivery",
      description: "Collaborate in small teams to simulate real workplace dynamics and accountability."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Portfolio",
      description: "Graduate with a polished portfolio website showcasing 3-5 real project deliverables."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Job & Client Matching",
      description: "Top performers get connected to paid opportunities through our talent marketplace."
    }
  ];

  const tracks = [
    {
      icon: <Code className="h-8 w-8" />,
      title: "Software Development",
      description: "Build production-ready applications",
      whatYouBuild: "Full-stack web apps, APIs, mobile applications",
      roles: "Junior Developer, Backend Engineer, Frontend Developer",
      deliverables: "GitHub portfolio, deployed apps, code documentation"
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Web Development",
      description: "Design and build modern websites",
      whatYouBuild: "Responsive websites, landing pages, WordPress sites",
      roles: "Web Developer, UI Developer, WordPress Developer",
      deliverables: "Live websites, design mockups, client projects"
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "Digital Marketing",
      description: "Drive growth through digital channels",
      whatYouBuild: "Marketing campaigns, content strategies, analytics reports",
      roles: "Digital Marketer, Social Media Manager, Content Strategist",
      deliverables: "Campaign portfolios, case studies, certifications"
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "E-commerce & Online Business",
      description: "Build and scale online businesses",
      whatYouBuild: "Online stores, product listings, sales funnels",
      roles: "E-commerce Manager, Marketplace Seller, Business Analyst",
      deliverables: "Store setups, sales reports, business plans"
    }
  ];

  const timelinePhases = [
    {
      weeks: "Weeks 1–3",
      title: "Skill Calibration",
      description: "Assess your current level, fill knowledge gaps, and prepare for project work.",
      activities: ["Skills assessment", "Foundation workshops", "Tool setup", "Team formation"]
    },
    {
      weeks: "Weeks 4–8",
      title: "Project Delivery",
      description: "Work on real client projects with mentor support and weekly sprints.",
      activities: ["Client briefs", "Weekly sprints", "Code reviews", "Progress demos"]
    },
    {
      weeks: "Weeks 9–12",
      title: "Professional Readiness",
      description: "Polish your portfolio, practice interviews, and connect with opportunities.",
      activities: ["Portfolio building", "Interview prep", "CV optimization", "Job matching"]
    }
  ];

  const outcomes = [
    "A polished portfolio with 3-5 real project pieces",
    "Real project experience you can reference in interviews",
    "A client-ready CV tailored to your track",
    "Interview preparation and mock practice",
    "Complete freelancer profile setup (Upwork, Fiverr)",
    "Professional references from mentors and peers"
  ];

  const faqs = [
    {
      question: "Do I need a degree?",
      answer: "No. We accept self-taught learners, career switchers, and anyone with foundational digital skills. Your ability and commitment matter more than formal credentials."
    },
    {
      question: "How many hours per week?",
      answer: "Plan for 15-20 hours per week including live sessions, project work, and mentorship calls. This is a serious commitment designed to deliver real results."
    },
    {
      question: "What if I have no experience?",
      answer: "You need foundational skills in your chosen track. If you're a complete beginner, start with our certificate courses first, then apply to the Accelerator."
    },
    {
      question: "How is mentorship delivered?",
      answer: "You get weekly 1-on-1 check-ins with your mentor plus group sessions. Mentors are industry practitioners who review your work and guide your progress."
    },
    {
      question: "Do you guarantee a job?",
      answer: "We don't guarantee jobs. We guarantee you'll be work-ready with a portfolio and skills that get you hired. Top performers access our talent marketplace for paid opportunities."
    },
    {
      question: "What tools do I need?",
      answer: "A laptop and reliable internet. Specific software depends on your track—we provide guidance during onboarding."
    },
    {
      question: "Can I pay in installments?",
      answer: "Yes. We offer a 2-installment plan: $120 before you start, $80 by week 4. Payment plans are arranged during enrollment."
    },
    {
      question: "When does the next cohort start?",
      answer: "We run cohorts every 8 weeks. Start the free skills audit to check your eligibility and see upcoming dates."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Maarifasasa Talent Accelerator | From Learning to Earning in 12 Weeks</title>
        <meta 
          name="description" 
          content="A 12-week hands-on program that builds real portfolio projects and connects top performers to paid opportunities. Start your free skills audit." 
        />
        <meta property="og:title" content="Maarifasasa Talent Accelerator | From Learning to Earning in 12 Weeks" />
        <meta property="og:description" content="A 12-week hands-on program that builds real portfolio projects and connects top performers to paid opportunities. Start your free skills audit." />
        <meta property="og:image" content="/og-image-talent-accelerator.png" />
        <meta property="og:url" content="https://www.maarifasasa.com/programs/talent-accelerator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Maarifasasa Talent Accelerator" />
        <meta name="twitter:description" content="From Learning to Earning in 12 Weeks. Start your free skills audit." />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Sticky Bottom CTA Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border transition-all duration-300 ${isSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-foreground hidden sm:block">Talent Accelerator</span>
          <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
            <Button onClick={handleStartAudit} size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              Start Learning to Earn
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">12-Week Intensive Program</span>
              </div>
              
              <h1 className="heading-xl mb-6 animate-fade-in text-foreground">
                From Learning to Earning in 12 Weeks
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
                Join a hands-on program that builds real portfolio work and connects top performers to paying opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-6">
                <Button onClick={handleStartAudit} size="lg" className="hover-lift text-lg px-8 py-6">
                  Start Learning to Earn
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button onClick={handleViewDetails} size="lg" variant="outline" className="hover-lift text-lg px-8 py-6">
                  View Program Details
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground animate-fade-in">
                Limited seats per cohort. Screening required.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof Strip */}
        <section className="py-12 bg-muted/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5,000+</div>
                <p className="text-muted-foreground">Learners trained</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1,000+</div>
                <p className="text-muted-foreground">Placed into paid digital work</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">Global</div>
                <p className="text-muted-foreground">Partners across Japan, Europe, and Africa</p>
              </div>
            </div>
            
            {/* Partner Logos Marquee */}
            <div className="w-full overflow-hidden">
              <div className="flex animate-marquee gap-12 items-center">
                {[
                  { name: "ILO", logo: "/lovable-uploads/partners/ilo-logo.png" },
                  { name: "BRAC", logo: "/lovable-uploads/partners/brac-logo.png" },
                  { name: "Enabel", logo: "/lovable-uploads/partners/enabel-logo.png" },
                  { name: "VVOB", logo: "/lovable-uploads/partners/vvob-logo.png" },
                  { name: "NSSF", logo: "/lovable-uploads/partners/nssf-logo.png" },
                  { name: "HiveColab", logo: "/lovable-uploads/partners/hivecolab-logo.png" },
                  { name: "Ministry of ICT", logo: "/lovable-uploads/partners/ict-ministry-logo.png" },
                  { name: "AVSI", logo: "/lovable-uploads/partners/avsi-logo.png" },
                  { name: "Tooro Kingdom", logo: "/lovable-uploads/partners/tooro-kingdom-logo.png" },
                  { name: "JICA", logo: "/lovable-uploads/partners/jica-logo.png" },
                  // Duplicate for seamless loop
                  { name: "ILO", logo: "/lovable-uploads/partners/ilo-logo.png" },
                  { name: "BRAC", logo: "/lovable-uploads/partners/brac-logo.png" },
                  { name: "Enabel", logo: "/lovable-uploads/partners/enabel-logo.png" },
                  { name: "VVOB", logo: "/lovable-uploads/partners/vvob-logo.png" },
                  { name: "NSSF", logo: "/lovable-uploads/partners/nssf-logo.png" },
                  { name: "HiveColab", logo: "/lovable-uploads/partners/hivecolab-logo.png" },
                  { name: "Ministry of ICT", logo: "/lovable-uploads/partners/ict-ministry-logo.png" },
                  { name: "AVSI", logo: "/lovable-uploads/partners/avsi-logo.png" },
                  { name: "Tooro Kingdom", logo: "/lovable-uploads/partners/tooro-kingdom-logo.png" },
                  { name: "JICA", logo: "/lovable-uploads/partners/jica-logo.png" },
                ].map((partner, index) => (
                  <img
                    key={`${partner.name}-${index}`}
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 md:h-12 w-auto max-w-[100px] md:max-w-[120px] object-contain grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300 flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem and Insight */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Skills are not enough. Proof is everything.</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {problemPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-destructive text-sm font-bold">✕</span>
                    </div>
                    <p className="text-foreground">{point}</p>
                  </div>
                ))}
              </div>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <p className="text-lg text-foreground text-center">
                    <strong>The truth:</strong> Companies don't hire certificates. They hire people who can deliver results. The Talent Accelerator gives you the proof that gets you paid.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What the Talent Accelerator Is */}
        <section id="what-is-accelerator" className="section-padding bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Not a course. A work-ready pipeline.</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  The Talent Accelerator combines real projects, mentorship, and job matching to transform your skills into income.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceleratorFeatures.map((feature, index) => (
                  <Card key={index} className="hover-lift border-border">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Is this for you?</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                      Perfect for
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[
                        "University students wanting work experience",
                        "Recent graduates struggling to land jobs",
                        "Self-taught learners ready to go professional",
                        "Career switchers entering tech or digital",
                        "Freelancers wanting to level up and earn more"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Target className="h-6 w-6 text-primary" />
                      You need
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[
                        { icon: <GraduationCap className="h-5 w-5" />, text: "Basic skills in your chosen track" },
                        { icon: <Laptop className="h-5 w-5" />, text: "A laptop or desktop computer" },
                        { icon: <Wifi className="h-5 w-5" />, text: "Reliable internet connection" },
                        { icon: <Clock className="h-5 w-5" />, text: "15-20 hours per week commitment" }
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-primary mt-0.5">{item.icon}</span>
                          <span className="text-foreground">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Not for you if:</strong> You are not able to commit weekly time to projects and deadlines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks */}
        <section className="section-padding bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Choose one track</h2>
                <p className="text-lg text-muted-foreground">
                  Specialize in one area and build deep expertise that employers value.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {tracks.map((track, index) => (
                  <Card key={index} className="hover-lift border-border overflow-hidden">
                    <CardHeader className="bg-primary/5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          {track.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{track.title}</CardTitle>
                          <p className="text-muted-foreground text-sm">{track.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">What you'll build:</p>
                        <p className="text-sm text-muted-foreground">{track.whatYouBuild}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Typical roles:</p>
                        <p className="text-sm text-muted-foreground">{track.roles}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Example deliverables:</p>
                        <p className="text-sm text-muted-foreground">{track.deliverables}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Talent Accelerator Courses (dynamic) */}
        {taCourses.length > 0 && (
          <section className="section-padding">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="heading-lg mb-4 text-foreground">
                    Talent Accelerator Courses
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Enroll in a specialized course inside the Talent Accelerator program.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {taCourses.map((course) => (
                    <Card key={course.id} className="hover-lift border-border flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-xl">{course.name}</CardTitle>
                        {course.duration && (
                          <p className="text-sm text-muted-foreground">{course.duration}</p>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between gap-4">
                        {course.description && (
                          <p className="text-muted-foreground text-sm line-clamp-4">
                            {course.description}
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
              </div>
            </div>
          </section>
        )}

        {/* 12-Week Structure */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">How the 12 weeks work</h2>
                <p className="text-lg text-muted-foreground">
                  A structured journey from skills assessment to job-ready professional.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {timelinePhases.map((phase, index) => (
                  <Card key={index} className="relative border-border overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
                    <CardHeader>
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full w-fit mb-3">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">{phase.weeks}</span>
                      </div>
                      <CardTitle className="text-xl">{phase.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{phase.description}</p>
                      <ul className="space-y-2">
                        {phase.activities.map((activity, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-foreground">{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Weekly Cadence
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">2 live sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">1-on-1 mentorship</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">Weekly assignments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">Project sprints</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="section-padding bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="heading-lg mb-4 text-foreground">What you graduate with</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{outcome}</span>
                  </div>
                ))}
              </div>
              
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-lg font-semibold text-foreground">
                    Top performers access paid opportunities through our talent marketplace.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How Earning Works */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="heading-lg mb-4 text-foreground">How you start earning</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Job Placements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Connect with companies hiring junior talent through our employer network.</p>
                  </CardContent>
                </Card>
                
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Freelance Gigs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Take on project-based work through freelance platforms with a polished profile.</p>
                  </CardContent>
                </Card>
                
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Offshore Teams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Join distributed teams serving clients in Japan, Europe, and North America.</p>
                  </CardContent>
                </Card>
                
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Agency Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Work on agency contracts through Maarifasasa's partner network.</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-primary/5 border-primary/20 mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-bold text-primary mb-2">$5 – $15 per hour</p>
                  <p className="text-muted-foreground">Typical earning range depending on skill level and track</p>
                </CardContent>
              </Card>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Transparency:</strong> Maarifasasa earns only when you earn through talent marketplace engagements.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="section-padding bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="heading-lg mb-8 text-foreground">Program fee</h2>
              
              <Card className="border-primary/30 overflow-hidden">
                <div className="bg-primary text-primary-foreground py-6">
                  <p className="text-5xl font-bold">$200</p>
                  <p className="text-primary-foreground/80 mt-1">One-time investment</p>
                </div>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-foreground mb-4">Everything included:</h3>
                  <ul className="space-y-3 text-left mb-6">
                    {[
                      "12 weeks of structured training",
                      "Weekly 1-on-1 mentorship sessions",
                      "Real client project experience",
                      "Portfolio website setup",
                      "CV and interview preparation",
                      "Job and client matching support"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="bg-accent/50 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      💡 Most learners recover the fee in their first paid engagements.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How to Join */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">How to join</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {[
                  {
                    step: "1",
                    title: "Take a free skills audit",
                    description: "Assess your current level and get personalized recommendations.",
                    icon: <Target className="h-6 w-6" />
                  },
                  {
                    step: "2",
                    title: "Complete a certificate course",
                    description: "Fill any skill gaps with our foundational courses.",
                    icon: <GraduationCap className="h-6 w-6" />
                  },
                  {
                    step: "3",
                    title: "Pass screening and enroll",
                    description: "Show your commitment and join the next cohort.",
                    icon: <UserCheck className="h-6 w-6" />
                  }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              
              <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-3">Ready to begin?</h3>
                  <p className="mb-6 text-primary-foreground/90">Take the first step toward your new career.</p>
                  <Button onClick={handleStartAudit} size="lg" variant="secondary" className="hover-lift">
                    Start Learning to Earn
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Lead Capture Form */}
        <section className="section-padding bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-border">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Not ready to start the audit?</CardTitle>
                  <p className="text-muted-foreground">Get cohort details and program updates sent to you.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={leadForm.fullName}
                          onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          required
                          placeholder="you@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          value={leadForm.whatsapp}
                          onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                          required
                          placeholder="+256..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={leadForm.country}
                          onChange={(e) => setLeadForm({ ...leadForm, country: e.target.value })}
                          required
                          placeholder="Your country"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="track">Track of Interest</Label>
                      <Select value={leadForm.track} onValueChange={(value) => setLeadForm({ ...leadForm, track: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a track" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="software-development">Software Development</SelectItem>
                          <SelectItem value="web-development">Web Development</SelectItem>
                          <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                          <SelectItem value="ecommerce">E-commerce & Online Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send me the details'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4 text-foreground">Frequently asked questions</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border rounded-lg px-6">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="heading-lg mb-4 text-foreground">Start the free skills audit today.</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get a clear roadmap, then qualify for the Accelerator.
              </p>
              <Button onClick={handleStartAudit} size="lg" className="hover-lift text-lg px-10 py-6">
                Start Learning to Earn
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TalentAccelerator;
