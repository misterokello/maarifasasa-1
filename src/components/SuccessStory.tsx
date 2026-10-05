
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface SuccessStoryProps {
  name: string;
  position: string;
  testimonial: string;
  imageUrl: string;
}

const SuccessStory = ({
  name,
  position,
  testimonial,
  imageUrl
}: SuccessStoryProps) => {
  return (
    <Card className="overflow-hidden h-full hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/10">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold">{name}</h4>
            <p className="text-sm text-muted-foreground">
              {position}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <Quote className="absolute -top-3 -left-1 h-8 w-8 text-primary/20" />
          <blockquote className="pl-7 pr-2 text-muted-foreground">
            {testimonial}
          </blockquote>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuccessStory;
