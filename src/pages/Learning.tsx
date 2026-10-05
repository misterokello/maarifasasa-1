import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Code, Award, Users, Clock, Target, CheckCircle, Smartphone, GraduationCap, Briefcase } from "lucide-react";

const BASE_URL = "https://maarifasasa.com";

const Learning = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Maarifasasa Learning Programs",
    "description": "Digital skills training programs including Talent Accelerator, Bootcamps, and Certificate Programs",
    "itemListElement": [
      {
        "@type": "Course",
        "position": 1,
        "name": "Talent Accelerator",
        "description": "12-week intensive program for career acceleration",
        "provider": { "@type": "Organization", "name": "Maarifasasa" }
      },
      {
        "@type": "Course",
        "position": 2,
        "name": "Bootcamps",
        "description": "Intensive hands-on training in web development, digital marketing, UI/UX design",
        "provider": { "@type": "Organization", "name": "Maarifasasa" }
      },
      {
        "@type": "Course",
        "position": 3,
        "name": "Certificate Programs",
        "description": "Industry-recognized certifications in AI, digital marketing, and more",
        "provider": { "@type": "Organization", "name": "Maarifasasa" }
      }
    ]
  };

  const programs = [
    {
      title: "Talent Accelerator",
      description: "Fast-track your career with our intensive talent development program designed to transform you into a job-ready professional.",
      icon: <Rocket className="h-8 w-8" />,
      color: "from-orange-500 to-amber-500",
      features: [
        "Personalized career coaching",
        "Industry mentorship",
        "Real-world project experience",
        "Job placement support"
      ],
      duration: "3-6 months",
      participants: "500+",
      link: "/programs/talent-accelerator"
    },
    {
      title: "Bootcamps",
      description: "Intensive, hands-on training programs that equip you with in-demand digital skills in a short time frame.",
      icon: <Code className="h-8 w-8" />,
      color: "from-blue-500 to-cyan-500",
      features: [
        "Intensive skill-building",
        "Project-based learning",
        "Expert-led sessions",
        "Peer collaboration"
      ],
      duration: "4-12 weeks",
      participants: "1,000+",
      link: "/programs/bootcamps"
    },
    {
      title: "Certificate Program",
      description: "Earn recognized certifications that validate your expertise and enhance your professional credibility.",
      icon: <Award className="h-8 w-8" />,
      color: "from-purple-500 to-pink-500",
      features: [
        "Industry-recognized certificates",
        "Comprehensive curriculum",
        "Flexible learning pace",
        "Portfolio development"
      ],
      duration: "Self-paced",
      participants: "2,000+",
      link: "/programs/certificates"
    },
    {
      title: "Digital Field Agents",
      description: "Train as a Digital Field Agent and earn over UGX 500,000 per month while helping farmers go digital.",
      icon: <Smartphone className="h-8 w-8" />,
      color: "from-emerald-500 to-teal-500",
      features: [
        "One-week practical training",
        "Work on the DigiFarmer platform",
        "Real income after training",
        "Digital data collection & soil sampling"
      ],
      duration: "1 week",
      participants: "300+",
      link: "/programs/digital-field-agents"
    },
    {
      title: "10X Programme with WITU",
      description: "Accelerate your career growth through intensive skills development and industry partnerships with Women in Tech Uganda.",
      icon: <GraduationCap className="h-8 w-8" />,
      color: "from-rose-500 to-red-500",
      features: [
        "Advanced tech skills training",
        "Industry mentorship from WITU experts",
        "10x career growth framework",
        "Project-based learning"
      ],
      duration: "Cohort-based",
      participants: "200+",
      link: "/programs/10x-programme"
    },
    {
      title: "Agency Programme",
      description: "Get matched with global remote opportunities through our job placement services and BPO solutions.",
      icon: <Briefcase className="h-8 w-8" />,
      color: "from-indigo-500 to-violet-500",
      features: [
        "Global remote job placements",
        "Business Process Outsourcing (BPO)",
        "Skills-to-opportunity matching",
        "International client network"
      ],
      duration: "Ongoing",
      participants: "150+",
      link: "/programs/agency-programme"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Learning Programs | Maarifasasa</title>
        <meta 
          name="description" 
          content="Choose your path: Talent Accelerator, Bootcamps, or Certificate Programs. 3,500+ trained with an 80% earning rate." 
        />
        <meta name="keywords" content="digital skills training, talent accelerator Uganda, coding bootcamp Africa, online certificates, web development course, digital marketing training, career acceleration program, learn to earn" />
        <link rel="canonical" href={`${BASE_URL}/learning`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/learning`} />
        <meta property="og:title" content="Learning Programs | Maarifasasa" />
        <meta property="og:description" content="Talent Accelerator, Bootcamps, and Certificate Programs — built to get you earning faster." />
        <meta property="og:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learning Programs | Maarifasasa" />
        <meta name="twitter:description" content="Transform your future with Maarifasasa learning programs. Talent Accelerator, Bootcamps, and Certificate Programs." />
        <meta name="twitter:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <main className="min-h-screen pt-24 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Transform Your Future Through Learning
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose from our range of learning programs designed to accelerate your career, 
              build in-demand skills, and earn recognized certifications.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="hover-lift">
                <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <Link to="/about">Learn More About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Learning Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the perfect program to match your learning goals and career aspirations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <Card key={index} className="group hover-lift overflow-hidden border-0 shadow-lg h-full flex flex-col">
                <div className={`bg-gradient-to-r ${program.color} p-6`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white">
                      {program.icon}
                    </div>
                    <CardTitle className="text-2xl text-white">{program.title}</CardTitle>
                  </div>
                </div>
                <CardContent className="p-6 flex-grow flex flex-col">
                  <CardDescription className="text-base mb-6">
                    {program.description}
                  </CardDescription>

                  <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{program.participants} trained</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {program.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full mt-auto group-hover:bg-primary/90">
                    <Link to={program.link} className="flex items-center justify-center">
                      Explore Program
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Learn With Us?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of learners who have transformed their careers through our programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Target className="h-6 w-6" />, title: "Industry-Focused", description: "Curriculum designed with input from industry leaders" },
              { icon: <Users className="h-6 w-6" />, title: "Expert Instructors", description: "Learn from professionals with real-world experience" },
              { icon: <CheckCircle className="h-6 w-6" />, title: "Practical Skills", description: "Hands-on projects that build your portfolio" },
              { icon: <Award className="h-6 w-6" />, title: "Recognized Credentials", description: "Certificates valued by employers globally" },
            ].map((benefit, index) => (
              <Card key={index} className="text-center p-6 hover-lift">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Take the first step towards transforming your career. Our team is here to help you 
                choose the right program for your goals.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="hover-lift">
                  <a href="https://form.maarifasasa.com/learn2earn" target="_blank" rel="noopener noreferrer">
                    Start Learning to Earn
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link to="/about">About Maarifasasa</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
    </>
  );
};

export default Learning;
