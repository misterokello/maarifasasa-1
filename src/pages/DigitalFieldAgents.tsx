import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Users, TrendingUp, Calendar, MapPin, Smartphone, Tablet, Award, Target, GraduationCap, Phone, Mail, MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import heroImage from '@/assets/dfa-hero-youths-tablet.jpg';

const DigitalFieldAgents = () => {
  // Analytics event tracking
  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName);
    }
    console.log(`Analytics event: ${eventName}`);
  };

  // Sticky mobile CTA
  useEffect(() => {
    const handleScroll = () => {
      const mobileCTA = document.getElementById('mobile-sticky-cta');
      if (mobileCTA) {
        if (window.scrollY > 300) {
          mobileCTA.classList.add('translate-y-0');
          mobileCTA.classList.remove('translate-y-20');
        } else {
          mobileCTA.classList.add('translate-y-20');
          mobileCTA.classList.remove('translate-y-0');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleApplyClick = () => {
    trackEvent('dfa_apply_click');
    window.open('https://form.maarifasasa.com/DFA', '_blank');
  };

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_click');
    // EDITABLE: Update WhatsApp number here
    window.open('https://wa.me/256770729228', '_blank');
  };

  const handleCallClick = () => {
    trackEvent('call_click');
    window.location.href = 'tel:+256770729228';
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Maarifasasa",
        "url": "https://www.maarifasasa.com",
        "logo": "https://www.maarifasasa.com/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+256770729228",
          "contactType": "customer service",
          "email": "learn@maarifasasa.com",
          "areaServed": "UG"
        }
      },
      {
        "@type": "Course",
        "name": "Digital Field Agents Training Program",
        "description": "Train for one week and start earning as a Digital Field Agent. Work on DigiFarmer registering farmers and conducting soil profiling.",
        "provider": {
          "@type": "Organization",
          "name": "Maarifasasa"
        },
        "offers": [
          {
            "@type": "Offer",
            "price": "150000",
            "priceCurrency": "UGX",
            "availability": "https://schema.org/InStock",
            "category": "Smartphone Plan"
          },
          {
            "@type": "Offer",
            "price": "300000",
            "priceCurrency": "UGX",
            "availability": "https://schema.org/InStock",
            "category": "Tablet Plan"
          }
        ]
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Digital Field Agents Training Program | Maarifasasa</title>
        <meta name="description" content="Train for one week and start earning as a Digital Field Agent. Work on DigiFarmer registering farmers and conducting soil profiling. Ugandan youth 18–30. Apply now." />
        
        {/* Open Graph */}
        <meta property="og:title" content="Digital Field Agents Training Program | Maarifasasa" />
        <meta property="og:description" content="Train for one week and start earning as a Digital Field Agent. Work on DigiFarmer registering farmers and conducting soil profiling. Ugandan youth 18–30. Apply now." />
        <meta property="og:image" content="/og-image-dfa.png" />
        <meta property="og:url" content="https://www.maarifasasa.com/programs/digital-field-agents" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Field Agents Training Program | Maarifasasa" />
        <meta name="twitter:description" content="Train for one week and start earning as a Digital Field Agent." />
        <meta name="twitter:image" content="/og-image-dfa.png" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">

        {/* Hero Section */}
        <section id="overview" className="relative min-h-screen flex items-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroImage}
              alt="Two African youths collaborating with a tablet"
              className="w-full h-full object-cover scale-105"
            />
            {/* Modern gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91]/95 via-[#0B3D91]/92 to-[#00ADEF]/88"></div>
            {/* Additional contrast layer */}
            <div className="absolute inset-0 bg-black/20"></div>
            {/* Animated accent shapes */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-[#00ADEF]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Main Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-[#00ADEF] rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/90 font-medium">Now Accepting Applications</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                  Learn. <br/>
                  <span className="text-[#00ADEF]">Earn.</span> <br/>
                  Impact.
                </h1>
                
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl">
                  Train as a Digital Field Agent and earn over <span className="font-bold text-[#00ADEF]">UGX 500,000</span> per month while helping farmers go digital.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleApplyClick}
                    size="lg"
                    className="bg-white text-[#0B3D91] hover:bg-[#00ADEF] hover:text-white text-lg px-10 py-6 rounded-full font-semibold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[#00ADEF]/50"
                  >
                    Apply Now
                  </Button>
                  <Button 
                    onClick={() => scrollToSection('faq')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white hover:text-[#0B3D91] text-lg px-10 py-6 rounded-full font-semibold transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Right Column - Features */}
              <div className="space-y-6">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#00ADEF] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">One Week Training</h3>
                      <p className="text-white/80">Intensive practical training to get you field-ready</p>
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#00ADEF] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">DigiFarmer Platform</h3>
                      <p className="text-white/80">Access cutting-edge digital agriculture tools</p>
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#00ADEF] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Real Income</h3>
                      <p className="text-white/80">Start earning immediately after certification</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Strip */}
        <section className="bg-white border-y border-gray-200 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center md:text-left max-w-2xl">
                <p className="text-gray-700">
                  A bold partnership between <span className="font-bold text-[#0B3D91]">Maarifasasa</span> and{' '}
                  <span className="font-bold text-[#0B3D91]">AgroSahas International Private Ltd</span>, the company behind DigiFarmer. 
                  We train and equip youth to power Africa's digital agriculture.
                </p>
              </div>
              <div className="flex items-center gap-8">
                {/* EDITABLE: Add actual logos */}
                <div className="w-32 h-16 bg-[#F3F6FF] rounded-lg flex items-center justify-center">
                  <span className="text-[#0B3D91] font-bold">Maarifasasa</span>
                </div>
                <div className="w-32 h-16 bg-[#F3F6FF] rounded-lg flex items-center justify-center">
                  <span className="text-[#0B3D91] font-bold">DigiFarmer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outcomes and Impact */}
        <section className="py-16 md:py-24 bg-[#F3F6FF]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] mb-4">
                Build skills. Open doors. Change lives.
              </h2>
              <p className="text-lg text-gray-600 italic">We build, we believe, we belong.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 border-[#00ADEF] hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-[#0B3D91] rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0B3D91]">Earn while you serve</h3>
                  <p className="text-gray-700">
                    Work as a Digital Field Agent and earn over UGX 500,000 per month.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#00ADEF] hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-[#0B3D91] rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0B3D91]">Real work on day one</h3>
                  <p className="text-gray-700">
                    Register farmers, conduct soil profiling and sampling, and onboard them onto DigiFarmer.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#00ADEF] hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-[#0B3D91] rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0B3D91]">National movement</h3>
                  <p className="text-gray-700">
                    Train 2,000 youth and digitalize 1,000,000 farmers in 2 years.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-12">
              How It Works
            </h2>

            <div className="max-w-4xl mx-auto space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#0B3D91] text-white rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0B3D91] mb-2">Apply online</h3>
                  <p className="text-gray-700 mb-3">Fill the quick form and pick your city.</p>
                  <Button onClick={handleApplyClick} size="sm" className="bg-[#00ADEF] hover:bg-[#00ADEF]/90">
                    Apply Now
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#0B3D91] text-white rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0B3D91] mb-2">One week training</h3>
                  <p className="text-gray-700">Hands on sessions, field practice, digital tools.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#0B3D91] text-white rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0B3D91] mb-2">Certification and deployment</h3>
                  <p className="text-gray-700">Join DigiFarmer tasks in your area.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#0B3D91] text-white rounded-full flex items-center justify-center text-xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0B3D91] mb-2">Learn and earn</h3>
                  <p className="text-gray-700">Hit your targets and grow your monthly earnings.</p>
                </div>
              </div>
            </div>

            {/* Skills Checklist */}
            <div className="mt-12 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-[#0B3D91] mb-6 text-center">Skills You'll Master</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Digital data collection',
                  'Farmer registration',
                  'Soil sampling basics',
                  'Mobile tools',
                  'Communication',
                  'Ethics'
                ].map((skill) => (
                  <div key={skill} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#00ADEF]" />
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Program Details */}
        <section className="py-16 md:py-24 bg-[#F3F6FF]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-12">
              Program Details
            </h2>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-[#00ADEF] mt-1" />
                    <div>
                      <h3 className="font-bold text-[#0B3D91] mb-1">Locations</h3>
                      {/* EDITABLE: Update locations here */}
                      <p className="text-gray-700">Lira and major towns and cities across Uganda.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-[#00ADEF] mt-1" />
                    <div>
                      <h3 className="font-bold text-[#0B3D91] mb-1">Next Start</h3>
                      {/* EDITABLE: Update next intake date here */}
                      <p className="text-gray-700">Cohorts run monthly. The next intake begins on <span className="font-bold">3 November</span>.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-6 w-6 text-[#00ADEF] mt-1" />
                    <div>
                      <h3 className="font-bold text-[#0B3D91] mb-1">Format</h3>
                      <p className="text-gray-700">In person with guided fieldwork. Some sessions online.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 text-[#00ADEF] mt-1" />
                    <div>
                      <h3 className="font-bold text-[#0B3D91] mb-1">Requirements</h3>
                      <p className="text-gray-700">Age 18–30, basic smartphone skills, commitment to one week, National ID.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 max-w-4xl mx-auto border-2 border-[#00ADEF]">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#0B3D91] mb-3">What You Get</h3>
                <p className="text-gray-700">Certification, mentorship, platform access, ongoing gigs.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-4">
              Pricing & Equipment
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              This is not a job placement fee. It is a short skills program that connects you to real earning opportunities on DigiFarmer.
            </p>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Smartphone Plan */}
              <Card className="border-2 border-[#0B3D91] hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center space-y-4">
                  <Smartphone className="h-12 w-12 text-[#00ADEF] mx-auto" />
                  <h3 className="text-2xl font-bold text-[#0B3D91]">Smartphone Plan</h3>
                  <div className="py-4">
                    {/* EDITABLE: Update pricing here */}
                    <p className="text-4xl font-bold text-[#0B3D91]">UGX 150,000</p>
                  </div>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Certification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Platform access</span>
                    </li>
                  </ul>
                  <Button onClick={handleApplyClick} className="w-full bg-[#0B3D91] hover:bg-[#0B3D91]/90">
                    Select Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Tablet Plan */}
              <Card className="border-2 border-[#00ADEF] hover:shadow-xl transition-shadow relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00ADEF] text-white px-4 py-1 rounded-full text-sm font-bold">
                  Popular
                </div>
                <CardContent className="p-8 text-center space-y-4">
                  <Tablet className="h-12 w-12 text-[#00ADEF] mx-auto" />
                  <h3 className="text-2xl font-bold text-[#0B3D91]">Tablet Plan</h3>
                  <div className="py-4">
                    {/* EDITABLE: Update pricing here */}
                    <p className="text-4xl font-bold text-[#0B3D91]">UGX 300,000</p>
                    <p className="text-sm text-gray-600 mt-2">You keep the tablet</p>
                  </div>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Certification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span>Platform access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#00ADEF] mt-0.5" />
                      <span className="font-bold">Tablet included</span>
                    </li>
                  </ul>
                  <Button onClick={handleApplyClick} className="w-full bg-[#00ADEF] hover:bg-[#00ADEF]/90">
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-gray-600 mt-8 max-w-2xl mx-auto">
              Fees ensure quality delivery and commitment. Scholarships may be announced on our socials.
            </p>
          </div>
        </section>

        {/* Success Path & Earnings */}
        <section className="py-16 md:py-24 bg-[#F3F6FF]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-8">
                Success Path & Earnings
              </h2>
              
              <Card className="mb-8">
                <CardContent className="p-8">
                  <p className="text-lg text-gray-700 text-center">
                    Agents are paid per completed task on DigiFarmer. High performers consistently cross UGX 500,000 per month.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 backdrop-blur-sm border-2 border-[#00ADEF]">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[#0B3D91] mb-4">Example Weekly Tasks & Earnings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Farmer registrations (20)</span>
                      <span className="font-bold text-[#0B3D91]">UGX 60,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Soil sampling (15)</span>
                      <span className="font-bold text-[#0B3D91]">UGX 75,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Platform onboarding (10)</span>
                      <span className="font-bold text-[#0B3D91]">UGX 40,000</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between items-center">
                      <span className="font-bold text-gray-700">Weekly Total</span>
                      <span className="font-bold text-[#00ADEF] text-xl">UGX 175,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">Monthly Potential (4 weeks)</span>
                      <span className="font-bold text-[#0B3D91] text-2xl">UGX 700,000</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4 italic">
                    *Earnings vary by effort, location, and task volume. This is an example illustration.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-12">
              What Our Agents Say
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* EDITABLE: Replace with actual testimonials */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 bg-[#F3F6FF] rounded-full mx-auto" />
                  <p className="text-gray-700 italic">
                    "The training opened doors I never knew existed. I'm earning and making real impact."
                  </p>
                  <div className="text-center">
                    <p className="font-bold text-[#0B3D91]">Sarah M.</p>
                    <p className="text-sm text-gray-600">Kampala</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 bg-[#F3F6FF] rounded-full mx-auto" />
                  <p className="text-gray-700 italic">
                    "I love that I'm helping farmers while building my own future. Best decision ever."
                  </p>
                  <div className="text-center">
                    <p className="font-bold text-[#0B3D91]">John K.</p>
                    <p className="text-sm text-gray-600">Lira</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 bg-[#F3F6FF] rounded-full mx-auto" />
                  <p className="text-gray-700 italic">
                    "The practical skills and tablet plan changed everything. I'm financially independent now."
                  </p>
                  <div className="text-center">
                    <p className="font-bold text-[#0B3D91]">Grace N.</p>
                    <p className="text-sm text-gray-600">Gulu</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24 bg-[#F3F6FF]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D91] text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    What is the Digital Field Agents Training Program?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    A one week practical program that equips youth with digital and agri data skills to support farmers and start earning on DigiFarmer.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    Who can apply?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Age 18–30 with basic smartphone skills and a heart for community impact.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    Is the training paid?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Yes. UGX 150,000 with your smartphone. UGX 300,000 with a tablet provided.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    Where are trainings held?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Lira and major towns and cities across Uganda.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    What will I learn?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Farmer registration, digital tools, soil profiling and sampling basics, ethics, communication.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    When do I start earning?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Right after certification and onboarding to field assignments.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    How much can I earn?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Many agents earn over UGX 500,000 per month based on targets and task volume.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    Is this paying to work?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    No. It is an investment in short skills that unlock real earning opportunities on a verified platform.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    Do I keep the tablet?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Yes, for the Tablet Plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" className="bg-white rounded-lg px-6 border-none">
                  <AccordionTrigger className="text-left font-bold text-[#0B3D91] hover:no-underline">
                    How do I apply?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Click Apply Now and complete the form at form.maarifasasa.com/DFA.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Band */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-[#0B3D91] to-[#00ADEF] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Ready to learn and earn?
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <Button 
                onClick={handleApplyClick}
                size="lg"
                className="bg-white text-[#0B3D91] hover:bg-gray-100 text-lg px-8 transition-transform hover:scale-105"
              >
                Apply Now
              </Button>
              <Button 
                onClick={handleWhatsAppClick}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Talk to us on WhatsApp
              </Button>
              <Button 
                onClick={handleCallClick}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call +256 770 729 228
              </Button>
            </div>
          </div>
        </section>

        {/* Contact & Footer */}
        <footer id="contact" className="bg-[#0B3D91] text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-xl mb-4">Maarifasasa</h3>
                <p className="text-sm text-gray-100">
                  Empowering African youth through digital skills and opportunities.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-4">Contact</h4>
                <div className="space-y-2 text-sm text-gray-100">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                    <span>Plot 26 Boundary Road, Lira City</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a href="mailto:learn@maarifasasa.com" className="hover:text-[#00ADEF]">
                      learn@maarifasasa.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href="tel:+256770729228" className="hover:text-[#00ADEF]">
                      +256 770 729 228
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <div className="space-y-2 text-sm text-gray-100">
                  <button onClick={() => scrollToSection('overview')} className="block hover:text-[#00ADEF]">
                    Overview
                  </button>
                  <button onClick={() => scrollToSection('how-it-works')} className="block hover:text-[#00ADEF]">
                    How It Works
                  </button>
                  <button onClick={() => scrollToSection('pricing')} className="block hover:text-[#00ADEF]">
                    Pricing
                  </button>
                  <button onClick={() => scrollToSection('faq')} className="block hover:text-[#00ADEF]">
                    FAQ
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4">Connect</h4>
                <div className="flex gap-4">
                  {/* EDITABLE: Add actual social links */}
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ADEF] transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/20 pt-8 text-center text-sm text-gray-100">
              <p>&copy; {new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Sticky Mobile CTA */}
        <div 
          id="mobile-sticky-cta"
          className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 translate-y-20 z-50"
        >
          <Button 
            onClick={handleApplyClick}
            className="w-full bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white text-lg py-6"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </>
  );
};

export default DigitalFieldAgents;
