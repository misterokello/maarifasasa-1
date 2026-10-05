import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import { Product, ProductCategory, PROGRAM_TYPE_LABELS } from "@/types/product";
import { formatUGX, formatUSD } from "@/lib/api/products";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import slugify from "slugify";
import ThinkificCourseSelect from "./ThinkificCourseSelect";

interface ProductEditFormProps {
  product: Product;
  category: ProductCategory;
  onSave: (product: Product) => void;
  onCancel: () => void;
  saving: boolean;
}

const ProductEditForm = ({
  product,
  category,
  onSave,
  onCancel,
  saving,
}: ProductEditFormProps) => {
  const [formData, setFormData] = useState<Product>({ ...product });

  const handleChange = (
    field: keyof Product,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => {
      if (field === "name" && typeof value === "string") {
        return {
          ...prev,
          [field]: value,
          slug: slugify(value, { lower: true, strict: true }),
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active Status */}
      <div className="flex items-center gap-4">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange("is_active", checked)}
        />
        <Label>Product is {formData.is_active ? "Active" : "Inactive"}</Label>
      </div>

      {/* Name and Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      {/* Duration and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={formData.duration || ""}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="e.g., 3 weeks, Self-paced"
            className="mt-1"
          />
        </div>
        {category === "bootcamp" && (
          <>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => handleChange("start_date", e.target.value || null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => handleChange("end_date", e.target.value || null)}
                className="mt-1"
              />
            </div>
          </>
        )}
      </div>

      {/* Program Type Selector (programs only) */}
      {category === "program" && (
        <div>
          <Label htmlFor="program_type">Program Category</Label>
          <Select
            value={formData.program_type ?? "partner_program"}
            onValueChange={(v) => handleChange("program_type", v)}
          >
            <SelectTrigger id="program_type" className="mt-1">
              <SelectValue placeholder="Select program category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            Talent Accelerator programs appear on the Talent Accelerator page.
          </p>
        </div>
      )}

      {/* Thinkific Course */}
      {(category === "certificate" || category === "bootcamp" || category === "program") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThinkificCourseSelect
            productId={formData.id}
            value={formData.thinkific_course_id}
            onChange={(value) => handleChange("thinkific_course_id", value)}
          />
          <div>
            <Label htmlFor="thinkific_url">Thinkific Course URL (optional)</Label>
            <Input
              id="thinkific_url"
              value={formData.thinkific_course_url || ""}
              onChange={(e) => handleChange("thinkific_course_url", e.target.value || null)}
              placeholder="e.g., https://maarifasasa.thinkific.com/courses/my-course"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Direct link to course for confirmation emails
            </p>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_ugx">Price (UGX)</Label>
          <Input
            id="price_ugx"
            type="number"
            min="0"
            value={formData.price_ugx}
            onChange={(e) => handleChange("price_ugx", parseInt(e.target.value) || 0)}
            className="mt-1"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formatUGX(formData.price_ugx)}
          </p>
        </div>
        <div>
          <Label htmlFor="price_usd">Price (USD)</Label>
          <Input
            id="price_usd"
            type="number"
            min="0"
            value={formData.price_usd}
            onChange={(e) => handleChange("price_usd", parseInt(e.target.value) || 0)}
            className="mt-1"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formatUSD(formData.price_usd)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ProductEditForm;
