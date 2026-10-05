import React from "react";
import { Helmet } from "react-helmet";
import ContactForm from "@/components/ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const BASE_URL = "https://maarifasasa.com";

const Contact = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Maarifasasa",
    "url": `${BASE_URL}/contact`,
    "telephone": "+256783146325",
    "email": "info@maarifasasa.com",
    "image": `${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lira",
      "addressRegion": "Northern Region",
      "addressCountry": "Uganda"
    },
    "openingHours": "Mo-Fr 09:00-17:00",
    "areaServed": "Africa"
  };

  return (
    <>
      <Helmet>
        <title>Contact Maarifasasa | Training & Partnerships</title>
        <meta 
          name="description" 
          content="Contact Maarifasasa for digital skills training, job placement, and partnerships. Based in Lira, Uganda. Call +256 783 146 325." 
        />
        <meta name="keywords" content="contact Maarifasasa, digital skills Uganda, partnership inquiries, youth training programs, job placement Africa, BPO services Uganda" />
        <link rel="canonical" href={`${BASE_URL}/contact`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/contact`} />
        <meta property="og:title" content="Contact Maarifasasa | Training & Partnerships" />
        <meta property="og:description" content="Contact us for digital skills training, job placement, and partnership opportunities in Lira, Uganda." />
        <meta property="og:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Maarifasasa | Digital Skills Training" />
        <meta name="twitter:description" content="Get in touch with Maarifasasa for digital skills training programs and partnership opportunities." />
        <meta name="twitter:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <main className="pt-20 pb-16">
      {/* Header */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="heading-lg mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have questions about our programs or want to explore partnership opportunities? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact Info & Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8">
                  We're here to answer any questions you might have about our programs, partnerships, or how we can work together to create digital opportunities for Africa's youth.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <Mail className="h-5 w-5 text-primary" />,
                    title: "Email Us",
                    details: "info@maarifasasa.com",
                    description: "We'll respond within 24 hours"
                  },
                  {
                    icon: <Phone className="h-5 w-5 text-primary" />,
                    title: "Call Us",
                    details: "+256 783 146 325",
                    description: "Mon-Fri from 9am to 5pm"
                  },
                  {
                    icon: <MapPin className="h-5 w-5 text-primary" />,
                    title: "Visit Us",
                    details: "Lira, Northern Uganda",
                    description: "Uganda"
                  },
                  {
                    icon: <Clock className="h-5 w-5 text-primary" />,
                    title: "Working Hours",
                    details: "Monday to Friday",
                    description: "9:00 AM - 5:00 PM"
                  }
                ].map((item, index) => (
                  <Card key={index} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">{item.icon}</div>
                        <div>
                          <h3 className="font-medium mb-1">{item.title}</h3>
                          <p className="font-bold text-foreground">{item.details}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Partnership Inquiries</h3>
                <p className="text-muted-foreground">
                  Interested in partnering with Maarifasasa? We collaborate with:
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span>Employers seeking digital talent</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span>Educational institutions</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span>Government agencies</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span>NGOs and foundations</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span>Corporate sponsors</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg overflow-hidden shadow-md h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.736367098661!2d32.89192947472621!3d2.2496069577855423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177638b86e06d30d%3A0x4ba120c9734dc70!2sMaarifasasa%20Limited!5e0!3m2!1sen!2sus!4v1707910493112!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Maarifasasa location in Lira, Uganda"
            ></iframe>
          </div>
        </div>
      </section>
    </main>
    </>
  );
};

export default Contact;
