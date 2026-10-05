
import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, ChevronRight } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-secondary pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/">
              <img src="/lovable-uploads/afef8974-952c-4670-93d3-91cfab42af06.png" alt="Maarifasasa Logo" className="h-10 mb-4" />
            </Link>
            <p className="text-muted-foreground">
              Unlocking 1 million earning opportunities in the digital economy for Africa's youth.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/maarifasasa" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com/maarifasasa" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com/maarifasasa" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com/company/maarifasasa" target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[{
              label: "Home",
              href: "/"
            }, {
              label: "Learning",
              href: "/learning"
            }, {
              label: "Blog",
              href: "/blog"
            }, {
              label: "About Us",
              href: "/about"
            }, {
              label: "Contact",
              href: "/contact"
            }, {
              label: "Careers",
              href: "/careers"
            }, {
              label: "Affiliate Program",
              href: "https://affiliates.maarifasasa.com"
            }].map(link => <li key={link.label}>
                  {link.href.startsWith("http") ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-foreground/70 hover:text-primary transition-colors flex items-center">
                      <ChevronRight size={16} className="mr-1" />
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="text-foreground/70 hover:text-primary transition-colors flex items-center">
                      <ChevronRight size={16} className="mr-1" />
                      {link.label}
                    </Link>
                  )}
                </li>)}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Program Tracks</h3>
            <ul className="space-y-2">
              {[{
              label: "Bootcamps",
              href: "/programs/bootcamps"
            }, {
              label: "Talent Accelerator",
              href: "/programs/talent-accelerator"
            }, {
              label: "Partner Programs",
              href: "/programs/partner-programs"
            }, {
              label: "Advanced Certificates",
              href: "/programs/certificates"
            }, {
              label: "Digital Field Agents",
              href: "/digital-field-agents"
            }, {
              label: "10X Programme",
              href: "/programs/10x-programme"
            }].map(track => <li key={track.label}>
                  <Link to={track.href} className="text-foreground/70 hover:text-primary transition-colors flex items-center">
                    <ChevronRight size={16} className="mr-1" />
                    {track.label}
                  </Link>
                </li>)}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="not-italic text-foreground/70 space-y-2">
              <p>Plot 26 Boundary Road</p>
              <p>Lira City, Uganda</p>
              <p>Email: info@maarifasasa.com</p>
              <p>Phone: +256 783 146 325</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Maarifasasa. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;
