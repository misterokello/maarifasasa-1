import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface BasicInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: Record<string, string>;
}

export const BasicInfoSection = ({ formData, setFormData, errors }: BasicInfoSectionProps) => {
  const [generatingBio, setGeneratingBio] = useState(false);

  const handleGenerateBio = async () => {
    try {
      setGeneratingBio(true);

      const { data, error } = await supabase.functions.invoke("generate-bio", {
        body: {
          userInfo: {
            name: formData.full_name,
            jobTitle: formData.job_title,
            company: formData.company,
            skills: formData.skills,
            interests: formData.interests,
            learningGoals: formData.learning_goals,
          },
        },
      });

      if (error) throw error;

      if (data?.bio) {
        setFormData({ ...formData, bio: data.bio });
        toast.success("Bio generated successfully!");
      }
    } catch (error: any) {
      console.error("Bio generation error:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("credits")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate bio. Please try again.");
      }
    } finally {
      setGeneratingBio(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
          />
          {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Corp"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateBio}
            disabled={generatingBio}
          >
            {generatingBio ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
        />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
      </div>
    </div>
  );
};
