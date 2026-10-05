
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Save, RotateCcw, Loader2, DollarSign } from "lucide-react";

type CourseActionsProps = {
  onAddCourse: () => void;
  onSaveCourses: () => void;
  onResetCourses: () => void;
  onUpdateAllPrices: () => void;
  edited: boolean;
  saving: boolean;
};

const CourseActions = ({ 
  onAddCourse, 
  onSaveCourses, 
  onResetCourses,
  onUpdateAllPrices,
  edited, 
  saving 
}: CourseActionsProps) => {
  return (
    <div className="flex justify-end gap-2 mb-6">
      <Button 
        variant="outline" 
        onClick={onResetCourses}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      <Button 
        onClick={onAddCourse}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Course
      </Button>
      <Button 
        onClick={onSaveCourses} 
        disabled={!edited || saving} 
        variant={edited ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Changes"}
      </Button>
      <Button 
        variant="outline" 
        onClick={onUpdateAllPrices}
        className="flex items-center gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Set All Prices to $100
      </Button>
    </div>
  );
};

export default CourseActions;
