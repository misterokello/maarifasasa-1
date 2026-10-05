import React from "react";
import {
  Bot,
  Code2,
  Leaf,
  Megaphone,
  Palette,
  ShoppingCart,
  Headphones,
  Laptop,
} from "lucide-react";

const domains = [
  { icon: Code2, label: "Software Development" },
  { icon: Bot, label: "Data & AI" },
  { icon: Megaphone, label: "Digital Marketing" },
  { icon: Laptop, label: "Freelancing & Digital Work" },
  { icon: Headphones, label: "Business Process & Support" },
  { icon: ShoppingCart, label: "E-commerce" },
  { icon: Leaf, label: "Agri-tech" },
  { icon: Palette, label: "Creative Digital Economy" },
];

const SkillsDomains = () => {
  return (
    <section className="section-padding bg-secondary/40">
      <div className="container mx-auto">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            Skills that pay
          </p>
          <h2 className="heading-lg">Trained for where the work actually is</h2>
          <p className="mt-3 text-muted-foreground">
            Curricula shaped by employer demand and mapped to national digital-economy priorities —
            delivered mobile-first, low-bandwidth, online and onsite.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {domains.map((domain) => (
            <div
              key={domain.label}
              className="hover-lift flex min-h-[110px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-5 text-center"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <domain.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{domain.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsDomains;
