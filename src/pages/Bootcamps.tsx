import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  Code,
  BarChart3,
  ShoppingCart,
  Calendar,
  Award,
  Laptop,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Globe,
  Briefcase,
} from "lucide-react";
import BootcampCohortsGrid from "@/components/bootcamps/BootcampCohortsGrid";

const Bootcamps = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    bootcamp: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const trackEvent = (eventName: string) => {
    console.log(`Analytics Event: ${eventName}`);
    // Placeholder for analytics integration
  };

  const handleStartLearning = () => {
    trackEvent("click_start_learning_bootcamp");
    window.open("https://form.maarifasasa.com/learn2earn", "_blank");
  };

  const handleViewBootcamp = (bootcampName: string) => {
    trackEvent(`click_view_${bootcampName.toLowerCase().replace(/\s+/g, "_")}`);
    const element = document.getElementById("bootcamps");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    trackEvent("submit_bootcamp_lead_form");

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Thanks for your interest!",
      description: "We'll share bootcamp details and enrollment information soon.",
    });

    setFormData({
      fullName: "",
      email: "",
      whatsapp: "",
      bootcamp: "",
      country: "",
    });
    setIsSubmitting(false);
  };

  // Hardcoded cohorts removed - now fetched dynamically via BootcampCohortsGrid

  // Available tracks
  const tracks = [
    {
      icon: <Code className="h-8 w-8" />,
      title: "Web Development",
      description:
        "Learn how to build modern websites from scratch. By the end, you will have a functional website and the confidence to keep building.",
      skills: ["HTML & CSS", "JavaScript", "Responsive Design", "Web Hosting", "Portfolio Site"],
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Digital Marketing",
      description:
        "Grow brands and sell online using content, social media, and campaigns. Graduate with a portfolio.",
      skills: ["Content Creation", "Social Media", "Campaign Execution", "Analytics", "Brand Growth"],
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI Vibe Coding",
      description:
        "Build with AI-assisted workflows to prototype faster and ship products—even starting from zero.",
      skills: ["AI Tools", "Prompt Engineering", "Rapid Prototyping", "No-Code/Low-Code", "Product Shipping"],
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "E-commerce",
      description:
        "Set up, run, and grow an online store—from product selection to fulfillment. Graduate with a ready-to-launch plan.",
      skills: ["Store Setup", "Product Selection", "Pricing Strategy", "Marketing", "Fulfillment"],
    },
  ];

  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Intensive & Focused",
      description: "4-8 weeks of concentrated learning designed for rapid skill acquisition.",
    },
    {
      icon: <Laptop className="h-6 w-6" />,
      title: "Hands-On Projects",
      description: "Learn by building real projects you can add to your portfolio.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Live Sessions",
      description: "Weekly live classes with instructors for real-time learning and Q&A.",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Peer Community",
      description: "Learn alongside motivated peers and build your professional network.",
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Certificate",
      description: "Earn a verified certificate upon successful completion.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Career Support",
      description: "Resume reviews, portfolio guidance, and job search strategies.",
    },
  ];

  const faqs = [
    {
      question: "How long are the bootcamps?",
      answer:
        "Bootcamps range from 4 to 8 weeks depending on the program. Each bootcamp is designed to give you practical, job-ready skills in the shortest time possible.",
    },
    {
      question: "Do I need prior experience?",
      answer:
        "Most bootcamps are designed for beginners. Basic computer literacy and a willingness to learn are the main requirements. Some advanced tracks may require foundational knowledge.",
    },
    {
      question: "How many hours per week should I commit?",
      answer:
        "Plan for 15-20 hours per week, including live sessions, self-study, and project work. Bootcamps are intensive by design.",
    },
    {
      question: "Are the sessions live or recorded?",
      answer:
        "We offer live sessions twice a week, plus recorded content you can access anytime. All live sessions are recorded for later review.",
    },
    {
      question: "What happens after I complete the bootcamp?",
      answer:
        "You receive a certificate, access to our alumni network, and career support. Top performers may qualify for the Talent Accelerator program for job matching.",
    },
    {
      question: "Can I pay in installments?",
      answer:
        "Yes, we offer flexible payment plans. You can pay in 2-3 installments depending on the bootcamp duration.",
    },
    {
      question: "What tools do I need?",
      answer:
        "A laptop with stable internet connection. Specific software requirements are shared before each bootcamp starts—most tools we use are free.",
    },
    {
      question: "When does the next cohort start?",
      answer:
        "We run new cohorts monthly. Complete the enrollment form to get notified about the next available dates for your chosen bootcamp.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Maarifasasa Bootcamps | Intensive Skills Training Programs</title>
        <meta
          name="description"
          content="Join intensive 4-8 week bootcamps in Web Development, Digital Marketing, UI/UX Design, and E-commerce. Build real projects and gain job-ready skills."
        />
        <meta property="og:title" content="Maarifasasa Bootcamps | Intensive Skills Training" />
        <meta
          property="og:description"
          content="Intensive bootcamps to rapidly upskill in tech and digital skills. Build real projects and earn certificates."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maarifasasa.com/programs/bootcamps" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Maarifasasa Bootcamps",
            description: "Intensive skills training bootcamps in tech and digital skills",
            provider: {
              "@type": "Organization",
              name: "Maarifasasa",
            },
          })}
        </script>
      </Helmet>

      {/* Sticky Header CTA */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${
          isScrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-foreground hidden sm:block">Maarifasasa Bootcamps</span>
          <div className="flex gap-3 ml-auto">
            <Button onClick={handleStartLearning} size="sm" className="bg-primary hover:bg-primary/90">
              Start Learning to Earn
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4 mr-2" />
              Intensive Skills Training
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in leading-tight">
              Master In-Demand Skills
              <span className="text-primary block mt-2">In Weeks, Not Years</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 animate-fade-in max-w-2xl mx-auto">
              Join intensive bootcamps designed for rapid skill acquisition. Learn by building real projects with expert guidance and peer support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-6">
              <Button onClick={handleStartLearning} size="lg" className="hover-lift text-lg px-8 py-6">
                Start Learning to Earn
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleViewBootcamp("all")}
                size="lg"
                variant="outline"
                className="hover-lift text-lg px-8 py-6"
              >
                View Bootcamps
              </Button>
            </div>

            <p className="text-sm text-muted-foreground animate-fade-in">
              New cohorts start monthly. Limited seats available.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">2,000+</div>
              <div className="text-muted-foreground">Bootcamp Graduates</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">3-12</div>
              <div className="text-muted-foreground">Weeks to Skill Up</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">85%</div>
              <div className="text-muted-foreground">Completion Rate</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4</div>
              <div className="text-muted-foreground">Specialized Tracks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Bootcamps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Bootcamps?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed for busy learners who want results fast without sacrificing quality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border hover-lift">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bootcamps Section */}
      <section id="bootcamps" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Bootcamp</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a cohort and pick the track that matches your goals.
            </p>
          </div>

          {/* Currently Open Cohorts */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-6 text-center">Currently Open Bootcamps</h3>
            <BootcampCohortsGrid />
          </div>

          {/* Available Tracks */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-center">Available Tracks (Choose One)</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {tracks.map((track, index) => (
                <Card key={index} className="border hover-lift overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-primary/5 p-6 border-b">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          {track.icon}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold">{track.title}</h4>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{track.description}</p>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          What You'll Learn
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {track.skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button onClick={handleStartLearning} className="w-full hover-lift">
                        Start Learning to Earn
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

      {/* Who It's For Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Are Bootcamps For?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our bootcamps are designed for motivated individuals ready to invest in their future.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border hover-lift">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-primary mr-2" />
                  Perfect For
                </h3>
                <ul className="space-y-4">
                  {[
                    "S.4 and S.6 leavers ready to learn practical digital skills",
                    "Students and beginners who want a clear, structured learning path",
                    "Anyone aiming to build a portfolio for internships, gigs, or entry-level opportunities",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover-lift">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <BookOpen className="h-6 w-6 text-primary mr-2" />
                  What You Need
                </h3>
                <ul className="space-y-4">
                  {[
                    "A laptop or computer",
                    "Stable internet connection",
                    "15-20 hours per week commitment",
                    "Basic computer literacy",
                    "Willingness to learn and practice",
                    "Self-motivation and discipline",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground bg-muted/50 inline-block px-6 py-3 rounded-lg">
              <strong>Not for you if:</strong> You cannot commit consistent weekly hours to learning and completing assignments.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Graduate With</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every bootcamp graduate leaves with tangible assets for their career.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <Briefcase className="h-6 w-6" />, title: "Portfolio Projects", desc: "Real work samples to showcase" },
              { icon: <Award className="h-6 w-6" />, title: "Verified Certificate", desc: "Proof of your new skills" },
              { icon: <TrendingUp className="h-6 w-6" />, title: "Practical Experience", desc: "Hands-on project work" },
              { icon: <Users className="h-6 w-6" />, title: "Peer Network", desc: "Connections with fellow learners" },
              { icon: <Globe className="h-6 w-6" />, title: "Career Resources", desc: "Resume and portfolio guidance" },
              { icon: <Zap className="h-6 w-6" />, title: "Accelerator Access", desc: "Path to job matching program" },
            ].map((item, index) => (
              <Card key={index} className="border hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Path to the Talent Accelerator</h3>
                <p className="text-muted-foreground">
                  Top bootcamp performers can qualify for the Talent Accelerator program—our 12-week pipeline to paid opportunities.
                </p>
                <Button onClick={handleStartLearning} className="mt-4 hover-lift" variant="default">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Not Ready to Enroll Yet?</h2>
                  <p className="text-muted-foreground">
                    Leave your details and we'll send you bootcamp schedules and more information.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        placeholder="WhatsApp Number"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Select
                        value={formData.bootcamp}
                        onValueChange={(value) => setFormData({ ...formData, bootcamp: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Interested Bootcamp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-development">Web Development</SelectItem>
                          <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                          <SelectItem value="ai-vibe-coding">AI Vibe Coding</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Input
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full hover-lift" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Me the Details"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Get answers to common questions about our bootcamps.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background border rounded-lg px-6 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline text-left font-semibold py-4">
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

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Skill Up?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Choose your bootcamp and start building real skills today.
            </p>
            <Button
              onClick={handleStartLearning}
              size="lg"
              variant="secondary"
              className="hover-lift text-lg px-10 py-6"
            >
              Start Learning to Earn
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Bootcamps;
