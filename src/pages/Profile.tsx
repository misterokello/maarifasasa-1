import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { BasicInfoSection } from "@/components/profile/BasicInfoSection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { LearningPreferencesSection } from "@/components/profile/LearningPreferencesSection";
import { NotificationSettings } from "@/components/profile/NotificationSettings";

const profileSchema = z.object({
  full_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  location: z.string().trim().max(100).optional(),
  job_title: z.string().trim().max(100).optional(),
  company: z.string().trim().max(100).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  linkedin_url: z.string().url().or(z.literal("")).optional(),
  github_url: z.string().url().or(z.literal("")).optional(),
  twitter_url: z.string().url().or(z.literal("")).optional(),
  bio: z.string().trim().max(500).optional(),
});

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    job_title: "",
    company: "",
    website: "",
    linkedin_url: "",
    github_url: "",
    twitter_url: "",
    bio: "",
    skills: [] as string[],
    interests: [] as string[],
    learning_goals: [] as string[],
    notification_preferences: {
      email_updates: true,
      course_updates: true,
      blog_updates: false,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load profile
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load profile");
        console.error("Profile load error:", error);
        return;
      }

      // If profile doesn't exist, create it
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: session.user.email || "",
            full_name: "",
          })
          .select()
          .single();

        if (insertError) {
          toast.error("Failed to create profile");
          console.error("Profile creation error:", insertError);
          return;
        }

        data = newProfile;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          location: data.location || "",
          job_title: data.job_title || "",
          company: data.company || "",
          website: data.website || "",
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          twitter_url: data.twitter_url || "",
          bio: data.bio || "",
          skills: data.skills || [],
          interests: data.interests || [],
          learning_goals: data.learning_goals || [],
          notification_preferences: (data.notification_preferences as any) || {
            email_updates: true,
            course_updates: true,
            blog_updates: false,
          },
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("An error occurred while loading your profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = profileSchema.parse(formData);
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name || null,
          phone: formData.phone || null,
          location: formData.location || null,
          job_title: formData.job_title || null,
          company: formData.company || null,
          website: validated.website || null,
          linkedin_url: validated.linkedin_url || null,
          github_url: validated.github_url || null,
          twitter_url: validated.twitter_url || null,
          bio: validated.bio || null,
          skills: formData.skills,
          interests: formData.interests,
          learning_goals: formData.learning_goals,
          notification_preferences: formData.notification_preferences,
        })
        .eq("id", session.user.id);

      if (error) {
        toast.error("Failed to update profile");
        console.error("Profile update error:", error);
        return;
      }

      toast.success("Profile updated successfully");
      checkAuthAndLoadProfile(); // Reload profile
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please check the form for errors");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Unable to load your profile. Please try logging in again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-24 pb-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <ProfileHeader profile={profile} onAvatarUpdate={checkAuthAndLoadProfile} />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-6">
                <TabsContent value="profile" className="space-y-6">
                  <BasicInfoSection
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                  />
                  <Separator />
                  <SocialLinksSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                <TabsContent value="learning" className="space-y-6">
                  <LearningPreferencesSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <NotificationSettings
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                <div className="flex gap-4 mt-6">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
