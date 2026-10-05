import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Award,
  Target,
  BookOpen,
  Heart,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lightbulb,
  UserCheck
} from "lucide-react";

const TenXProgramme = () => {
  const programFeatures = [
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Comprehensive Digital Skills",
      description: "Training in digital marketing, web development, graphic design, data management, and more."
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Job Placement Support",
      description: "Direct connection to digital economy opportunities with 1,344 placements over 3 years."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Inclusive Access",
      description: "5% allocation for Women Living with Disabilities and 3% for refugees."
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Industry Recognition",
      description: "Partnership with Women in Technology Uganda (WITU) and proven track record."
    }
  ];

  const trainingAreas = [
    "Digital Marketing",
    "Web Development",
    "Graphic Design",
    "Data Management",
    "Computer Literacy",
    "Online Safety",
    "Data Entry",
    "Digital Tools & Platforms"
  ];

  const careerSupport = [
    {
      title: "Resume Building",
      description: "Professional guidance on creating compelling resumes that stand out."
    },
    {
      title: "Interview Preparation",
      description: "Mock interviews and expert tips to boost your confidence."
    },
    {
      title: "Personal Branding",
      description: "Learn to market yourself effectively in the digital space."
    },
    {
      title: "Networking",
      description: "Connect with industry professionals and potential employers."
    },
    {
      title: "Job Matching",
      description: "Access to exclusive job boards and employer partnerships."
    },
    {
      title: "Mentorship",
      description: "Ongoing guidance from experienced professionals in your field."
    }
  ];

  const impactStats = [
    { number: "560", label: "Young Women Trained (3 years)", icon: <Users className="h-5 w-5" /> },
    { number: "1,344", label: "Job Placements Target", icon: <Briefcase className="h-5 w-5" /> },
    { number: "5%", label: "Women with Disabilities", icon: <Heart className="h-5 w-5" /> },
    { number: "3%", label: "Refugee Participants", icon: <Globe className="h-5 w-5" /> }
  ];

  return (
    <>
      <Helmet>
        <title>10X Programme with WITU | Maarifasasa</title>
        <meta 
          name="description" 
          content="Join the 10X Programme - empowering young women with digital skills and connecting them to the digital economy through partnership with Women in Technology Uganda (WITU)." 
        />
        <meta property="og:title" content="10X Programme with WITU | Maarifasasa" />
        <meta 
          property="og:description" 
          content="Join the 10X Programme - empowering young women with digital skills and connecting them to the digital economy through partnership with Women in Technology Uganda (WITU)." 
        />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "10X Programme with WITU",
          "description": "Digital skills and remote-work training for young women in Uganda, delivered in partnership with Women in Technology Uganda (WITU).",
          "provider": {
            "@type": "Organization",
            "name": "Maarifasasa",
            "sameAs": "https://maarifasasa.com"
          },
          "url": "https://maarifasasa.com/programs/10x-programme",
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "blended",
            "location": { "@type": "Place", "address": "Uganda" }
          }
        })}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Partnership with WITU</span>
              </div>
              <h1 className="heading-xl mb-6 animate-fade-in">
                10X Programme: Empowering Young Women in Tech
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
                A transformative initiative by Maarifasasa and Women in Technology Uganda (WITU) to equip young women with essential digital skills and connect them to sustainable opportunities in the digital economy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                <Button asChild size="lg" className="hover-lift">
                  <a href="https://form.maarifasasa.com/SCHOLARSHIP" target="_blank" rel="noopener noreferrer">Apply Now</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover-lift">
                  <a href="#about-program">Learn More</a>
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

        {/* About Program */}
        <section id="about-program" className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-lg mb-4">About the 10X Programme</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  The 10X Programme addresses critical gaps in digital skills, career readiness, and employability for underserved youth in Uganda, with a strong focus on empowering young women.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <Target className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Program Goal</h3>
                      <p className="text-muted-foreground">
                        The 10X Program aims to create a holistic and sustainable pathway for youth to access digital skills and secure employment or entrepreneurial opportunities in the growing digital economy. By 2027, the program seeks to equip 4,800 young women with basic and intermediate digital skills and connect 3,840 of them to direct work opportunities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Training Areas */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="heading-lg mb-4">Digital Skills Training</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Comprehensive instruction in essential digital competencies through a blended learning approach that includes both in-person and virtual sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainingAreas.map((area, index) => (
                  <Card key={index} className="hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">{area}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 border-border">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Hands-On, Project-Based Learning</h3>
                      <p className="text-muted-foreground">
                        Our training goes beyond theory. Through hands-on assignments and real-world projects, you'll gain practical experience directly applicable to job environments. We utilize hybrid learning models to increase accessibility, including offline resources for participants in remote areas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Career Support */}
        <section className="section-padding">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <UserCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="heading-lg mb-4">Employment Transition & Career Support</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  We don't just train you—we help you succeed. Our comprehensive career support ensures you're ready to enter and thrive in the digital workforce.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careerSupport.map((support, index) => (
                  <Card key={index} className="border-border hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{support.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{support.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        Job Placement Services
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Partnerships with employers in the digital economy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Access to freelance, remote, and in-house positions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Matching with tech companies and digital agencies</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Post-Placement Support
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Periodic check-ins and continued career advice</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Support for sustainable career development</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">Alumni network and community support</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Inclusivity */}
        <section className="section-padding bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="border-border">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center mb-8">
                    <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h2 className="heading-lg mb-4">Inclusivity & Equitable Access</h2>
                    <p className="text-lg text-muted-foreground">
                      The 10X Programme is committed to reaching marginalized groups and ensuring that everyone has the opportunity to succeed in the digital economy.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-background rounded-lg p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Women Living with Disabilities
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        5% allocation with assistive technology, adapted learning materials, and accessible training environments.
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Refugee Participants
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        3% allocation with tailored resources, cultural sensitivity, and assistance navigating legal employment requirements.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Coverage Areas:</strong> The program covers Northern Uganda including Lira, Gulu, Arua, Nebbi, and Adjumani, ensuring digital skills training reaches underserved communities.
                    </p>
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
                Ready to Transform Your Future?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join the 10X Programme and become part of a movement empowering young women across Uganda to thrive in the digital economy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="hover-lift">
                  <a href="https://form.maarifasasa.com/SCHOLARSHIP" target="_blank" rel="noopener noreferrer">
                    Apply to Join
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover-lift">
                  <Link to="/about">
                    Learn About Maarifasasa
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

export default TenXProgramme;
