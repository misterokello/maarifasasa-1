import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background z-0"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-[10%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-8 max-w-2xl animate-fade-in mt-8">
            <div>
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary mb-4">
                <span>Learn. Earn. Grow.</span>
              </div>
              <h1 className="heading-xl text-violet-800">Unlocking Earning Opportunities for Africa's Youth</h1>
              <p className="mt-6 text-xl text-slate-900">
                Empowering 1 million young Africans with in-demand digital skills 
                and connecting them to global earning opportunities.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="group">
                <Link to="/learning">
                  Learning Programs
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                <span>Expert-Led Courses</span>
              </div>
              <div className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-primary" />
                <span>Global Opportunities</span>
              </div>
              <div className="flex items-center">
                <Globe className="mr-2 h-5 w-5 text-primary" />
                <span>Digital Entrepreneurship</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-slide-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay"></div>
              <img alt="African students learning digital skills" width={1200} height={800} fetchPriority="high" decoding="async" className="w-full h-auto object-cover transform scale-[1.01] hover:scale-[1.03] transition-transform duration-700" src="/lovable-uploads/58928ad6-b263-4564-9df1-f54365aba727.jpg" />
            </div>
            
            {/* Stats card */}
            <div className="absolute -bottom-6 -left-6 glass-panel rounded-xl p-4 shadow-lg animate-float">
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Youths Trained</p>
                  <p className="text-2xl font-bold">10K +</p>
                </div>
              </div>
            </div>
            
            {/* Success card */}
            <div className="absolute -top-6 -right-6 glass-panel rounded-xl p-4 shadow-lg animate-float" style={{
            animationDelay: "1s"
          }}>
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Briefcase className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Placements</p>
                  <p className="text-2xl font-bold">1,500+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;