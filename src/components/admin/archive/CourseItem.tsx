
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { CourseProps } from "@/components/CourseCard";

type CourseItemProps = {
  course: CourseProps;
  onInputChange: (id: string, field: keyof CourseProps, value: string | number) => void;
  onDeleteCourse: (id: string) => void;
  categories: Array<{ value: string; label: string }>;
};

const CourseItem = ({ course, onInputChange, onDeleteCourse, categories }: CourseItemProps) => {
  return (
    <Card key={course.id} className="mb-6 p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Label htmlFor={`title-${course.id}`} className="mb-2 block">Title</Label>
            <Input
              id={`title-${course.id}`}
              value={course.title}
              onChange={(e) => onInputChange(course.id, "title", e.target.value)}
            />
          </div>
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={() => onDeleteCourse(course.id)}
            className="ml-4"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor={`description-${course.id}`} className="mb-2 block">Description</Label>
            <Textarea
              id={`description-${course.id}`}
              value={course.description}
              onChange={(e) => onInputChange(course.id, "description", e.target.value)}
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor={`imageUrl-${course.id}`} className="mb-2 block">Image URL</Label>
            <Input
              id={`imageUrl-${course.id}`}
              value={course.imageUrl}
              onChange={(e) => onInputChange(course.id, "imageUrl", e.target.value)}
            />
            
            <div className="mt-2 aspect-video bg-gray-100 rounded-md overflow-hidden">
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/640x360?text=Invalid+Image+URL';
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor={`category-${course.id}`} className="mb-2 block">Category</Label>
            <Select 
              value={course.category} 
              onValueChange={(value) => onInputChange(course.id, "category", value)}
            >
              <SelectTrigger id={`category-${course.id}`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`duration-${course.id}`} className="mb-2 block">Duration</Label>
            <Input
              id={`duration-${course.id}`}
              value={course.duration}
              onChange={(e) => onInputChange(course.id, "duration", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor={`price-${course.id}`} className="mb-2 block">Price ($)</Label>
            <Input
              id={`price-${course.id}`}
              type="number"
              min="0"
              step="0.01"
              value={course.price}
              onChange={(e) => onInputChange(course.id, "price", parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor={`studentsCount-${course.id}`} className="mb-2 block">Students Count</Label>
            <Input
              id={`studentsCount-${course.id}`}
              type="number"
              min="0"
              value={course.studentsCount}
              onChange={(e) => onInputChange(course.id, "studentsCount", parseInt(e.target.value, 10))}
            />
          </div>
          
          <div>
            <Label htmlFor={`rating-${course.id}`} className="mb-2 block">Rating (0-5)</Label>
            <Input
              id={`rating-${course.id}`}
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={course.rating}
              onChange={(e) => onInputChange(course.id, "rating", parseFloat(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor={`url-${course.id}`} className="mb-2 block">Course URL</Label>
            <Input
              id={`url-${course.id}`}
              value={course.url}
              onChange={(e) => onInputChange(course.id, "url", e.target.value)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CourseItem;
