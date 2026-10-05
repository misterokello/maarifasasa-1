
import React from "react";
import { Loader2 } from "lucide-react";
import { CourseProps } from "@/components/CourseCard";
import CourseItem from "./CourseItem";
import CourseActions from "./CourseActions";

type CoursesTabContentProps = {
  courses: CourseProps[];
  loading: boolean;
  edited: boolean;
  saving: boolean;
  categories: Array<{ value: string; label: string }>;
  handleInputChange: (id: string, field: keyof CourseProps, value: string | number) => void;
  handleDeleteCourse: (id: string) => void;
  handleAddCourse: () => void;
  handleSaveCourses: () => void;
  handleResetCourses: () => void;
  handleUpdateAllPrices: () => void;
};

const CoursesTabContent = ({
  courses,
  loading,
  edited,
  saving,
  categories,
  handleInputChange,
  handleDeleteCourse,
  handleAddCourse,
  handleSaveCourses,
  handleResetCourses,
  handleUpdateAllPrices
}: CoursesTabContentProps) => {
  if (loading) {
    return (
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Loading courses...</h2>
      </div>
    );
  }

  return (
    <>
      <CourseActions
        onAddCourse={handleAddCourse}
        onSaveCourses={handleSaveCourses}
        onResetCourses={handleResetCourses}
        onUpdateAllPrices={handleUpdateAllPrices}
        edited={edited}
        saving={saving}
      />
      
      {courses.map((course) => (
        <CourseItem
          key={course.id}
          course={course}
          onInputChange={handleInputChange}
          onDeleteCourse={handleDeleteCourse}
          categories={categories}
        />
      ))}
    </>
  );
};

export default CoursesTabContent;
