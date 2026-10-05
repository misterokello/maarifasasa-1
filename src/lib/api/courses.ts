import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CourseProps } from "@/components/CourseCard";

// Helper function to map Thinkific course to CourseProps
const mapThinkificCourse = (thinkificCourse: any): CourseProps => {
  // Get the best available image, prioritizing course_card_image_url (correct Thinkific field name)
  const imageUrl = thinkificCourse.course_card_image_url || 
                   thinkificCourse.image_url || 
                   thinkificCourse.banner_image_url || 
                   'https://via.placeholder.com/640x360?text=Course+Image';
  
  return {
    id: thinkificCourse.id.toString(),
    title: thinkificCourse.name || 'Untitled Course',
    description: thinkificCourse.description || thinkificCourse.card_description || 'No description available',
    imageUrl: imageUrl,
    category: thinkificCourse.collection_ids?.[0] || 'General',
    duration: '8 weeks', // Thinkific doesn't provide duration, using default
    studentsCount: thinkificCourse.user_count || 0,
    rating: 4.5, // Thinkific doesn't provide ratings, using default
    price: 0, // Thinkific doesn't provide price in API, using free
    url: `https://maarifasasa.thinkific.com/courses/${thinkificCourse.slug}`,
    created_at: thinkificCourse.created_at
  };
};

// Helper function to map the database course object to CourseProps
export const mapDbCourseToCourseProps = (dbCourse: any): CourseProps => {
  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    imageUrl: dbCourse.image_url,
    category: dbCourse.category,
    duration: dbCourse.duration,
    studentsCount: dbCourse.students_count,
    rating: dbCourse.rating,
    price: dbCourse.price,
    url: dbCourse.url,
    created_at: dbCourse.created_at
  };
};

// Helper function to map CourseProps to database object
export const mapCoursePropsToDbCourse = (course: CourseProps): any => {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    image_url: course.imageUrl,
    category: course.category,
    duration: course.duration,
    students_count: course.studentsCount,
    rating: course.rating,
    price: course.price,
    url: course.url,
    created_at: course.created_at
  };
};

// Function to fetch courses from Thinkific via edge function
export const fetchCoursesFromThinkific = async (): Promise<CourseProps[]> => {
  try {
    console.log('Fetching courses from Thinkific...');
    
    const { data, error } = await supabase.functions.invoke('thinkific-courses');
    
    if (error) {
      console.error('Error calling Thinkific edge function:', error);
      throw error;
    }
    
    console.log('Thinkific API response:', data);
    
    // Thinkific returns courses in an items array
    const courses = data?.items || [];
    
    // Map Thinkific courses to our CourseProps format
    const mappedCourses = courses.map(mapThinkificCourse);
    
    console.log(`Successfully fetched ${mappedCourses.length} courses from Thinkific`);
    
    return mappedCourses;
  } catch (error) {
    console.error("Error fetching courses from Thinkific:", error);
    toast.error("Failed to load courses from Thinkific. Please try again later.");
    return [];
  }
};

// Function to fetch courses from Supabase
export const fetchCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('id');
    
    if (error) {
      throw error;
    }
    
    // Map the database objects to CourseProps objects
    return (data || []).map(mapDbCourseToCourseProps);
  } catch (error) {
    console.error("Error fetching courses:", error);
    toast.error("Failed to load courses. Please try again later.");
    return [];
  }
};

// Function to save a single course to Supabase
export const saveCourse = async (course: CourseProps) => {
  try {
    const dbCourse = mapCoursePropsToDbCourse(course);
    
    // Add a timestamp for the update
    dbCourse.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('courses')
      .upsert(dbCourse, { 
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error saving course:", error);
    toast.error("Failed to save course. Please try again later.");
    return false;
  }
};

// Function to save multiple courses to Supabase
export const saveCourses = async (courses: CourseProps[]) => {
  try {
    const dbCourses = courses.map(course => {
      const dbCourse = mapCoursePropsToDbCourse(course);
      // Add a timestamp for the update
      dbCourse.updated_at = new Date().toISOString();
      return dbCourse;
    });
    
    const { error } = await supabase
      .from('courses')
      .upsert(dbCourses, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    toast.success("Courses saved successfully!");
    return true;
  } catch (error) {
    console.error("Error saving courses:", error);
    toast.error("Failed to save courses. Please try again later.");
    return false;
  }
};

// Function to fetch a single course by ID
export const fetchCourseById = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Map the database object to a CourseProps object
    return data ? mapDbCourseToCourseProps(data) : null;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    toast.error("Failed to load course details. Please try again later.");
    return null;
  }
};

// Function to delete a course from Supabase
export const deleteCourse = async (courseId: string) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
    toast.error("Failed to delete course. Please try again later.");
    return false;
  }
};

// Function to reset courses to default sample data
export const resetCourses = async () => {
  try {
    // For now we'll just refetch the data
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('id');
    
    if (error) {
      throw error;
    }
    
    // Map the database objects to CourseProps objects
    return (data || []).map(mapDbCourseToCourseProps);
  } catch (error) {
    console.error("Error resetting courses:", error);
    toast.error("Failed to reset courses. Please try again later.");
    return [];
  }
};

// New function to update all course prices
export const updateAllCoursePrices = async (newPrice: number) => {
  try {
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('*');
    
    if (fetchError) {
      console.error("Error fetching courses:", fetchError);
      toast.error("Failed to fetch courses for price update.");
      return false;
    }
    
    const updatedCourses = courses.map(course => ({
      ...course,
      price: newPrice
    }));
    
    const { error } = await supabase
      .from('courses')
      .upsert(updatedCourses, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error("Error updating course prices:", error);
      toast.error("Failed to update course prices.");
      return false;
    }
    
    toast.success(`All courses updated to $${newPrice}`);
    return true;
  } catch (error) {
    console.error("Unexpected error updating course prices:", error);
    toast.error("An unexpected error occurred.");
    return false;
  }
};
