import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { GraduationCap, Briefcase, BookOpen, Users, Laptop, ChevronRight, ArrowRight, CheckCircle2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "https://maarifasasa.com";

const LearnAndEarn = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Maarifasasa Learn & Earn Program",
    "description": "Comprehensive digital skills training program connecting African youth to global remote opportunities",
    "areaServed": "Africa",
    "educationalCredentialAwarded": "Digital Skills Certificate"
  };

  // Program features and benefits
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Comprehensive Curriculum",
      description: "Master in-demand digital skills with our structured, industry-aligned curriculum designed for the global job market."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Expert Mentorship",
      description: "Learn from experienced professionals who provide personalized guidance and feedback throughout your learning journey."
    },
    {
      icon: <Laptop className="h-8 w-8 text-primary" />,
      title: "Hands-on Projects",
      description: "Build a professional portfolio with real-world projects that demonstrate your skills to potential employers."
    },
    {
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      title: "Job Placement",
      description: "Get matched with global remote opportunities through our network of hiring partners and dedicated career support."
    }
  ];

  // Available courses
  const courses = [
    {
      title: "Web Development",
      skills: ["HTML/CSS", "JavaScript", "React", "Node.js"],
      level: "Beginner to Advanced",
      duration: "16 weeks"
    },
    {
      title: "Digital Marketing",
      skills: ["SEO", "Social Media", "Content Marketing", "PPC"],
      level: "Beginner to Intermediate",
      duration: "12 weeks"
    },
    {
      title: "Data Analysis",
      skills: ["Excel", "SQL", "Python", "Data Visualization"],
      level: "Beginner to Advanced",
      duration: "14 weeks"
    },
    {
      title: "UX/UI Design",
      skills: ["User Research", "Wireframing", "Prototyping", "Figma"],
      level: "Beginner to Intermediate",
      duration: "10 weeks"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Learn & Earn Program | Master Digital Skills, Get Remote Jobs | Maarifasasa</title>
        <meta 
          name="description" 
          content="Master web development, digital marketing, data analysis & UX design. 6,000+ youth trained, 80% employment rate. Get matched with global remote opportunities. Start earning today!" 
        />
        <meta name="keywords" content="learn and earn, remote jobs Africa, digital skills training, web development course, digital marketing training, data analysis course, UX design bootcamp, freelancing Africa, global remote work" />
        <link rel="canonical" href={`${BASE_URL}/learn-and-earn`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/learn-and-earn`} />
        <meta property="og:title" content="Learn & Earn Program | Master Digital Skills, Get Remote Jobs | Maarifasasa" />
        <meta property="og:description" content="Master web development, digital marketing, data analysis & UX design. 6,000+ youth trained, 80% employment rate." />
        <meta property="og:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn & Earn Program | Maarifasasa" />
        <meta name="twitter:description" content="Master digital skills and get matched with global remote opportunities. 80% employment rate." />
        <meta name="twitter:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-r from-primary/10 to-primary/5 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-0 py-1.5 px-4 text-sm">
              Learn & Earn Program
            </Badge>
            <h1 className="heading-xl mb-6">Master Digital Skills, Launch Your Global Career</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our comprehensive training program that equips you with in-demand digital skills and connects you with global remote opportunities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[180px]">
                <Link to="/learning">
                  Explore Courses
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[180px]">
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
            {[
              { 
                value: "6,000+", 
                label: "Youths Trained Globally" 
              },
              { 
                value: "1,200+", 
                label: "Graduates Employed Remotely" 
              },
              { 
                value: "95%", 
                label: "Course Completion Rate" 
              },
              { 
                value: "80%", 
                label: "Employment Success Rate" 
              },
            ].map((stat, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-6 rounded-lg bg-secondary shadow-sm hover-lift"
              >
                <div className="text-3xl font-bold mb-2 text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Program Features</h2>
            <p className="text-muted-foreground text-lg">
              Our comprehensive approach ensures you develop both technical skills and professional capabilities needed for the global job market.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover-lift bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Courses Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Available Courses</h2>
            <p className="text-muted-foreground text-lg">
              Choose from a variety of in-demand digital skills courses designed to prepare you for the global job market.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map((course, index) => (
              <Card key={index} className="border border-border shadow-sm hover-lift overflow-hidden bg-white h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                      {course.duration}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Level: {course.level}</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">Skills you'll learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.skills.map((skill, i) => (
                        <div key={i} className="text-xs bg-secondary px-3 py-1 rounded-full">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="ghost" className="mt-auto" size="sm">
                    <Link to="/learning" className="flex items-center">
                      Learn more <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild>
              <Link to="/learning" className="flex items-center">
                View All Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-lg mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-lg">
              Hear from our graduates who have successfully transitioned to global remote careers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The Learn & Earn program gave me the skills and confidence to land a remote job with a tech company in Europe. The mentorship was invaluable.",
                name: "Amara Okafor",
                role: "Web Developer at TechGlobal"
              },
              {
                quote: "I went from zero coding knowledge to building professional websites in just four months. Now I work remotely for clients around the world.",
                name: "Kwame Mensah",
                role: "Frontend Developer at RemoteFirst"
              },
              {
                quote: "The digital marketing course completely transformed my career path. I now work with a US-based agency and earn three times my previous salary.",
                name: "Zainab Ibrahim",
                role: "Digital Marketing Specialist"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-none shadow-md hover-lift bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <svg className="h-8 w-8 text-primary/50" fill="currentColor" viewBox="0 0 32 32">
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/10 -skew-x-12 transform origin-top-right"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-lg mb-6">Ready to Launch Your Global Career?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of young Africans who have transformed their careers and lives through our digital skills programs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link to="/learning">
                  Explore Courses
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px]">
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

export default LearnAndEarn;
