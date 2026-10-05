import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, RefreshCw, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThinkificCourse {
  id: number;
  name: string;
  slug: string;
}

interface ThinkificCourseSelectProps {
  productId: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

const ThinkificCourseSelect = ({ productId, value, onChange }: ThinkificCourseSelectProps) => {
  const [courses, setCourses] = useState<ThinkificCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-courses");
      
      if (error) {
        throw error;
      }

      const fetchedCourses = (data?.items as ThinkificCourse[]) || [];
      setCourses(fetchedCourses);
      setLoaded(true);
      
      if (fetchedCourses.length === 0) {
        toast.info("No courses found in your Thinkific account");
      }
    } catch (error) {
      console.error("Failed to fetch Thinkific courses:", error);
      toast.error("Failed to load Thinkific courses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => String(c.id) === value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={`thinkific-${productId}`}>Thinkific Course</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchCourses}
          disabled={loading}
          className="h-6 px-2 text-xs"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`thinkific-${productId}`}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={loading && !loaded}
            className="w-full justify-between font-normal"
          >
            {loading && !loaded ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading courses...
              </span>
            ) : selectedCourse ? (
              <span className="truncate">
                {selectedCourse.name}
                <span className="text-xs text-muted-foreground ml-2">
                  ID: {selectedCourse.id}
                </span>
              </span>
            ) : value ? (
              <span className="text-destructive truncate">Unknown course (ID: {value})</span>
            ) : (
              <span className="text-muted-foreground">Search and select a course...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search) => {
              return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder="Search courses by name or ID..." />
            <CommandList>
              <CommandEmpty>No courses found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none no course linked"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">No course linked</span>
                </CommandItem>
                {courses.map((course) => (
                  <CommandItem
                    key={course.id}
                    value={`${course.name} ${course.id} ${course.slug ?? ""}`}
                    onSelect={() => {
                      onChange(String(course.id));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        String(course.id) === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{course.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ID: {course.id}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCourse && (
        <p className="text-sm text-primary mt-1">
          ✓ Linked to: "{selectedCourse.name}" (ID: {selectedCourse.id})
        </p>
      )}
      {!selectedCourse && value && loaded && (
        <p className="text-sm text-destructive mt-1">
          ⚠ Course ID {value} not found in your account
        </p>
      )}
      {!value && loaded && (
        <p className="text-sm text-muted-foreground mt-1">
          Select a course for auto-enrollment
        </p>
      )}
    </div>
  );
};

export default ThinkificCourseSelect;
