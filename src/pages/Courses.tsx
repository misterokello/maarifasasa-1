import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import CourseCard, { CourseProps } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { fetchCoursesFromThinkific } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const BASE_URL = "https://maarifasasa.com";

const Courses = () => {
  const [courses, setCourses] = useState<CourseProps[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Maarifasasa Digital Skills Courses",
    "description": "Browse digital skills courses in web development, digital marketing, AI, graphics design, and more",
    "itemListOrder": "https://schema.org/ItemListOrderDescending"
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Digital Marketing", label: "Digital Marketing" },
    { value: "Graphics Design", label: "Graphics Design" },
    { value: "AI & Data Science", label: "AI & Data Science" },
    { value: "Virtual Assistance", label: "Virtual Assistance" },
    { value: "Web Development", label: "Web Development" },
  ];

  const loadCourses = async () => {
    try {
      setLoading(true);
      const fetchedCourses = await fetchCoursesFromThinkific();
      setCourses(fetchedCourses);
      setFilteredCourses(fetchedCourses);
      
      if (fetchedCourses.length > 0) {
        toast.success(`Loaded ${fetchedCourses.length} courses from Thinkific`);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const filtered = courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
    
    // Sort by created_at from newest to oldest
    const sorted = filtered.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setFilteredCourses(sorted);
  }, [searchTerm, categoryFilter, courses]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  return (
    <>
      <Helmet>
        <title>Digital Skills Courses | Web Dev, Marketing, AI & Design | Maarifasasa</title>
        <meta 
          name="description" 
          content="Browse 50+ digital skills courses in web development, digital marketing, AI & data science, graphics design, and virtual assistance. Start learning today and launch your global career!" 
        />
        <meta name="keywords" content="digital skills courses, web development course, digital marketing training, AI course Africa, graphics design course, virtual assistant training, online courses Uganda, tech courses Africa" />
        <link rel="canonical" href={`${BASE_URL}/courses`} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/courses`} />
        <meta property="og:title" content="Digital Skills Courses | Web Dev, Marketing, AI & Design | Maarifasasa" />
        <meta property="og:description" content="Browse 50+ digital skills courses in web development, digital marketing, AI & data science, and more." />
        <meta property="og:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Skills Courses | Maarifasasa" />
        <meta name="twitter:description" content="Browse 50+ digital skills courses. Start learning today!" />
        <meta name="twitter:image" content={`${BASE_URL}/lovable-uploads/f84d4f1d-9a1e-4432-bffe-dc88a4b66e9f.png`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <main className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="heading-lg">Explore Our Courses</h1>
          <p className="text-lg text-muted-foreground">
            Discover a wide range of digital skills courses designed to prepare you for the global digital economy.
          </p>
          <Button 
            onClick={loadCourses} 
            variant="outline" 
            size="sm"
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload Courses
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <Label htmlFor="search" className="mb-2 block">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by course name or keywords..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category" className="mb-2 block">Category</Label>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
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
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading courses...</span>
          </div>
        ) : (
          <>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
    </>
  );
};

export default Courses;
