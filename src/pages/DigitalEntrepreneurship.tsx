import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Briefcase, Rocket, Lightbulb, Users, BarChart3, Globe, HandCoins, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "https://maarifasasa.com";

const DigitalEntrepreneurship = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Digital Entrepreneurship Program",
    "description": "Launch and grow your digital business with expert guidance, practical resources, and mentorship",
    "provider": {
      "@type": "Organization",
      "name": "Maarifasasa"
    }
  };

  // Program features
  const features = [{
    icon: <Lightbulb className="h-8 w-8 text-[#10B981]" />,
    title: "Business Model Development",
    description: "Learn how to create a sustainable business model for your digital venture with proven frameworks and strategies."
  }, {
    icon: <Globe className="h-8 w-8 text-[#10B981]" />,
    title: "Digital Marketing Mastery",
    description: "Develop comprehensive digital marketing strategies to acquire customers and grow your business online."
  }, {
    icon: <HandCoins className="h-8 w-8 text-[#10B981]" />,
    title: "Financial Management",
    description: "Master essential financial skills for entrepreneurs, from pricing strategies to cash flow management."
  }, {
    icon: <Users className="h-8 w-8 text-[#10B981]" />,
    title: "Mentorship & Networking",
    description: "Connect with successful entrepreneurs and industry experts who provide guidance throughout your journey."
  }];

  // Business tracks
  const businessTracks = [{
    title: "Freelance Services",
    description: "Build a successful freelance business offering digital services to clients worldwide.",
    skills: ["Personal Branding", "Service Packaging", "Client Acquisition", "Project Management"],
    icon: <Briefcase className="h-6 w-6 text-[#10B981]" />
  }, {
    title: "Digital Products",
    description: "Create and sell digital products such as courses, templates, or software solutions.",
    skills: ["Product Development", "E-commerce", "Digital Rights", "Customer Support"],
    icon: <Rocket className="h-6 w-6 text-[#10B981]" />
  }, {
    title: "Content Creation",
    description: "Build a business around content creation through blogging, podcasting, or video production.",
    skills: ["Content Strategy", "Audience Building", "Monetization", "Content Distribution"],
    icon: <Lightbulb className="h-6 w-6 text-[#10B981]" />
  }, {
    title: "E-commerce",
    description: "Launch and scale an online store selling physical or digital products to a global audience.",
    skills: ["Product Sourcing", "Store Management", "Logistics", "Customer Experience"],
    icon: <BarChart3 className="h-6 w-6 text-[#10B981]" />
  }];

  return (
    <>
      <Helmet>
        <title>Digital Entrepreneurship Program | Start Your Online Business | Maarifasasa</title>
        <meta 
          name="description" 
          content="Launch your digital business with expert mentorship. Learn freelancing, e-commerce, content creation & digital products. 700+ successful entrepreneurs, 85% business survival rate. Start today!" 
        />
        <meta name="keywords" content="digital entrepreneurship, start online business Africa, freelancing course, e-commerce training, content creator course, digital business, online entrepreneur program, startup training Uganda" />
        <link rel="canonical" href={`${BASE_URL}/digital-entrepreneurship`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/digital-entrepreneurship`} />
        <meta property="og:title" content="Digital Entrepreneurship Program | Start Your Online Business | Maarifasasa" />
        <meta property="og:description" content="Launch your digital business with expert mentorship. 700+ successful entrepreneurs, 85% business survival rate." />
        <meta property="og:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Entrepreneurship Program | Maarifasasa" />
        <meta name="twitter:description" content="Launch your digital business with expert mentorship. 700+ successful entrepreneurs." />
        <meta name="twitter:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#10B981]/10 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#10B981]/10 rounded-full filter blur-3xl opacity-50"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30 border-0 py-1.5 px-4 text-sm">
              Digital Entrepreneurship Program
            </Badge>
            <h1 className="heading-xl mb-6 text-red-600">Launch & Grow Your Digital Business</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your skills into a thriving digital business with expert guidance, practical resources, and a supportive community of entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[180px] bg-[#10B981] hover:bg-[#10B981]/90">
                <Link to="/learning">
                  Explore Program
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[180px] border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10">
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
            value: "700+",
            label: "Successful Digital Entrepreneurs"
          }, {
            value: "85%",
            label: "Business Survival Rate"
          }, {
            value: "500+",
            label: "Global Clients Served"
          }, {
            value: "40+",
            label: "Countries Reached"
          }].map((stat, index) => <div key={index} className="flex flex-col items-center text-center p-6 rounded-lg bg-secondary shadow-sm hover-lift">
                <div className="text-3xl font-bold mb-2 text-[#10B981]">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Program Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Program Features</h2>
            <p className="text-muted-foreground text-lg">
              Our comprehensive approach ensures you develop both the entrepreneurial mindset and practical skills needed to succeed in the digital economy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <Card key={index} className="border-none shadow-md hover-lift bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Business Tracks Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Business Tracks</h2>
            <p className="text-muted-foreground text-lg">
              Choose the path that aligns with your vision and goals for your digital business journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessTracks.map((track, index) => <Card key={index} className="border border-border shadow-sm hover-lift overflow-hidden bg-white h-full">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/10">
                      {track.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{track.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">{track.description}</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">Key skills developed:</h4>
                    <ul className="space-y-2">
                      {track.skills.map((skill, i) => <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 mr-2 text-[#10B981]" />
                          <span>{skill}</span>
                        </li>)}
                    </ul>
                  </div>
                  <Button asChild variant="ghost" className="mt-auto" size="sm">
                    <Link to="/learning" className="flex items-center text-[#10B981]">
                      Learn more <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>)}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild className="bg-[#10B981] hover:bg-[#10B981]/90">
              <Link to="/learning" className="flex items-center">
                View All Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-lg">
              Hear from entrepreneurs who have built thriving digital businesses through our program.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
            quote: "The mentorship and community support helped me turn my graphic design skills into a thriving freelance business with clients across Europe and North America.",
            name: "Fatima Kamara",
            role: "Founder, DesignFlow Creative"
          }, {
            quote: "I launched my digital marketing agency after completing the program. Within a year, we were serving clients in 5 countries and I had to hire two team members.",
            name: "Victor Osei",
            role: "CEO, Global Digital Solutions"
          }, {
            quote: "My e-learning platform now generates passive income while I sleep. The business model development module was particularly transformative for my entrepreneurial journey.",
            name: "Esther Mulinge",
            role: "Founder, SkillsAfrica"
          }].map((testimonial, index) => <Card key={index} className="border-none shadow-md hover-lift bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <svg className="h-8 w-8 text-[#10B981]/50" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="ml-0">
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#10B981]/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-[#10B981]/10 -skew-x-12 transform origin-top-right"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-lg mb-6">Ready to Start Your Digital Business?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of successful digital entrepreneurs and transform your skills into a thriving business.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[200px] bg-[#10B981] hover:bg-[#10B981]/90">
                <Link to="/learning">
                  Explore Program
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px] border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10">
                <Link to="/contact">
                  Contact Us
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

export default DigitalEntrepreneurship;