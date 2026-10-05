import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  Globe, 
  TrendingUp, 
  Users,
  CheckCircle2,
  ArrowRight,
  Target,
  Headphones,
  BarChart,
  FileText,
  Mail,
  UserCheck,
  Rocket
} from "lucide-react";

const AgencyProgramme = () => {
  const programFeatures = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Remote Opportunities",
      description: "Access to international job markets with remote positions from companies worldwide."
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Business Process Outsourcing",
      description: "BPO services connecting you to sustainable digital work opportunities."
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Skills-to-Opportunity Matching",
      description: "We match your unique skills with the right opportunities in the global market."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Career Growth Support",
      description: "Ongoing mentorship and career development to help you advance professionally."
    }
  ];

  const services = [
    {
      icon: <Headphones className="h-5 w-5" />,
      title: "Customer Support Services",
      description: "Virtual customer service roles for international companies"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Data Entry & Management",
      description: "Accurate data processing and database management services"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Virtual Assistance",
      description: "Administrative support and executive assistance roles"
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      title: "Digital Marketing",
      description: "Social media management, content creation, and SEO services"
    }
  ];

  const benefits = [
    "Competitive international pay rates",
    "Flexible remote work arrangements",
    "Professional development opportunities",
    "Access to global client networks",
    "Ongoing training and upskilling",
    "Career advancement pathways",
    "Supportive work community",
    "Performance-based growth"
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Skills Assessment",
      description: "We evaluate your digital skills and identify your strengths and areas for growth."
    },
    {
      step: "2",
      title: "Job Matching",
      description: "Based on your profile, we match you with suitable remote opportunities from our global network."
    },
    {
      step: "3",
      title: "Placement Support",
      description: "We provide interview preparation, resume optimization, and onboarding assistance."
    },
    {
      step: "4",
      title: "Ongoing Growth",
      description: "Continuous mentorship and career support to help you thrive in your role."
    }
  ];

  const impactStats = [
    { number: "1,200+", label: "Digital Freelancers Placed", icon: <Users className="h-5 w-5" /> },
    { number: "80%", label: "Employment Success Rate", icon: <Target className="h-5 w-5" /> },
    { number: "Global", label: "Job Market Access", icon: <Globe className="h-5 w-5" /> },
    { number: "24/7", label: "Support Available", icon: <Rocket className="h-5 w-5" /> }
  ];

  return (
    <>
      <Helmet>
        <title>Agency Programme | Maarifasasa</title>
        <meta 
          name="description" 
          content="Connect with global remote opportunities through Maarifasasa's Agency Programme. Access BPO services, job placement, and international career pathways." 
        />
        <meta property="og:title" content="Agency Programme | Maarifasasa" />
        <meta 
          property="og:description" 
          content="Connect with global remote opportunities through Maarifasasa's Agency Programme. Access BPO services, job placement, and international career pathways." 
        />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Maarifasasa Agency Programme",
          "description": "Connects trained African talent to global remote work and BPO opportunities, with job placement and ongoing career support.",
          "provider": {
            "@type": "Organization",
            "name": "Maarifasasa",
            "sameAs": "https://maarifasasa.com"
          },
          "url": "https://maarifasasa.com/programs/agency-programme",
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online"
          }
        })}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Global Opportunities</span>
              </div>
              <h1 className="heading-xl mb-6 animate-fade-in">
                Agency Programme: Your Gateway to Global Remote Work
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
                Connect with international employers and access sustainable remote work opportunities through our comprehensive job placement services and Business Process Outsourcing solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                <Button asChild size="lg" className="hover-lift">
                  <Link to="/contact">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover-lift">
                  <a href="#how-it-works">Learn How It Works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {impactStats.map((stat, index) => (
                  <Card key={index} className="text-center hover-lift">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Program Features */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4">Why Choose Our Agency Programme?</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  We bridge the gap between talented Ugandan youth and global employers, creating sustainable career pathways in the digital economy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {programFeatures.map((feature, index) => (
                  <Card key={index} className="border-border hover-lift">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BPO Services */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="heading-lg mb-4">Business Process Outsourcing Services</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Access diverse BPO opportunities across multiple industries and service categories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service, index) => (
                  <Card key={index} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{service.title}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Our streamlined process ensures you're connected to the right opportunities quickly and effectively.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {howItWorks.map((item, index) => (
                  <Card key={index} className="border-border hover-lift">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4">Programme Benefits</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Join thousands of successful digital workers who have transformed their careers through our Agency Programme.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">{benefit}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <Target className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Our Commitment</h3>
                      <p className="text-muted-foreground">
                        We're committed to creating sustainable earning opportunities for African youth in the digital economy. With over 1,200 digital freelancers successfully placed and an 80% employment success rate, we've proven our ability to connect talented individuals with meaningful global opportunities. Our extensive network of international employers and ongoing support ensures you have the resources needed to thrive in your remote career.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="heading-lg mb-6">
                Ready to Access Global Opportunities?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Take the first step toward a rewarding remote career. Join our Agency Programme and connect with international employers today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="hover-lift">
                  <Link to="/contact">
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover-lift">
                  <Link to="/programs">
                    View All Programs
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AgencyProgramme;
