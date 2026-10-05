
import React from "react";
import { Clock, Users, Star, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CourseProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  duration: string;
  studentsCount: number;
  rating: number;
  price: number;
  url: string;
  created_at?: string;
}

const CourseCard = ({ course }: { course: CourseProps }) => {
  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={course.imageUrl || 'https://via.placeholder.com/640x360?text=Course+Image'}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/640x360?text=Course+Image';
          }}
        />
        <Badge className="absolute top-3 left-3">{course.category}</Badge>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {course.description || "Learn valuable skills with this comprehensive course."}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span>{course.studentsCount.toLocaleString()} students</span>
          </div>
          <div className="flex items-center">
            <Star className="mr-1 h-4 w-4 text-yellow-500" />
            <span>{course.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t">
        <div className="flex items-center justify-end w-full">
          <a 
            href={course.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground flex items-center">
              Enroll Now
              <ExternalLink className="ml-1 h-3 w-3" />
            </Badge>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
