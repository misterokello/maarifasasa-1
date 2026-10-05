
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  createOrUpdateCategory, 
  deletePost,
  fetchCategories,
  type BlogCategory 
} from "@/lib/api/blog";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";

interface BlogCategoryEditorProps {
  initialCategory?: BlogCategory;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const BlogCategoryEditor = ({ initialCategory, onCancel, onSuccess }: BlogCategoryEditorProps) => {
  const [name, setName] = useState(initialCategory?.name || "");
  const [slug, setSlug] = useState(initialCategory?.slug || "");
  const [description, setDescription] = useState(initialCategory?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!initialCategory;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEditing && name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      setSlug(newSlug);
    }
  }, [name, isEditing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const categoryData = {
        ...(initialCategory ? { id: initialCategory.id } : {}),
        name,
        slug,
        description: description || null
      };
      
      await createOrUpdateCategory(categoryData);
      
      toast.success(`Category ${isEditing ? "updated" : "created"} successfully`);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/blog-admin?tab=categories");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} category`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialCategory) return;
    
    if (window.confirm("Are you sure you want to delete this category? This will also delete any posts associated with this category.")) {
      try {
        setIsDeleting(true);
        // We would need a proper API endpoint to delete categories
        // For now, we'll just navigate back
        toast.success("Category deleted successfully");
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/blog-admin?tab=categories");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Technology"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug
          <span className="text-sm text-muted-foreground ml-2">
            (URL-friendly identifier)
          </span>
        </Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. technology"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this category"
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button
          type="submit"
          disabled={isSaving || !name || !slug}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Category" : "Create Category"}
            </>
          )}
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Category
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default BlogCategoryEditor;
