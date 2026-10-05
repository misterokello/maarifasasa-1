import React from "react";

const partners = [
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
];

interface TrustedBySectionProps {
  variant?: "light" | "dark";
  className?: string;
}

const TrustedBySection: React.FC<TrustedBySectionProps> = ({ 
  variant = "light",
  className = "" 
}) => {
  const bgClass = variant === "dark" ? "bg-muted/50" : "bg-background";
  
  return (
    <section className={`py-12 ${bgClass} ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-muted-foreground font-medium uppercase tracking-wider text-sm mb-8">
          Trusted By
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12 lg:gap-x-16">
          {partners.map((partner) => (
            <div 
              key={partner.name} 
              className="grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 md:h-12 lg:h-14 w-auto max-w-[120px] md:max-w-[140px] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
