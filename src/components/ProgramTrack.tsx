import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ProgramTrackProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  link: string;
  color: string;
}

const ProgramTrack: React.FC<ProgramTrackProps> = ({
  icon,
  title,
  description,
  features,
  link,
  color,
}) => {
  return (
    <Card className="border border-border shadow-sm hover-lift overflow-hidden bg-white h-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="mr-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4">{description}</p>
        <ul className="list-disc pl-5 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="text-sm text-foreground/80">
              {feature}
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" className="mt-auto" size="sm">
          <Link to={link} className="flex items-center" style={{ color: color }}>
            Learn more
            <ArrowRight className="ml-2 h-4 w-4" style={{ color: color }} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgramTrack;
