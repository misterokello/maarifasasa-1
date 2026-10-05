import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Award, BookOpen, Bookmark, ClipboardList, CreditCard, Handshake, LineChart, ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";
import { PaymentHistory } from "@/components/dashboard/PaymentHistory";
import { AvailableProducts } from "@/components/dashboard/AvailableProducts";
import { LearnerProfile } from "@/components/dashboard/LearnerProfile";
import { ThinkificAccess } from "@/components/dashboard/ThinkificAccess";
import { OnboardingPrompt } from "@/components/dashboard/OnboardingPrompt";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { Certificates } from "@/components/dashboard/Certificates";
import { Assignments } from "@/components/dashboard/Assignments";
import { SavedCourses } from "@/components/dashboard/SavedCourses";
import LearnerDashboardTour from "@/components/onboarding/LearnerDashboardTour";
import PartnerPortalPanel, { fetchMyPartnerCodes } from "@/components/partner/PartnerPortalPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Auto-claim any referral code registered with this email, then reveal
      // the Partner Portal tab when the account owns at least one code.
      fetchMyPartnerCodes(session.user.id)
        .then((codes) => setIsPartner(codes.length > 0))
        .catch(() => setIsPartner(false));

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile load error:", profileError);
      }

      // If profile doesn't exist, create it
      if (!profileData) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Profile creation error:", insertError);
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(profileData);
      }

      // Self-heal: back-fill the Thinkific LMS account for any learner whose
      // signup-time provisioning was missed (idempotent, fire-and-forget).
      if (!profileData?.thinkific_user_id) {
        supabase.functions.invoke("thinkific-user-provision").catch(() => {});
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-24 pb-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Learner'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your learning journey, view your enrollments, and track your progress.
          </p>
        </div>

        {/* Onboarding prompt (only if not yet completed) */}
        {user?.id && profile && <OnboardingPrompt userId={user.id} profile={profile} />}

        {/* Quick Access to Thinkific */}
        <ThinkificAccess />

        {/* Onboarding Tour */}
        <LearnerDashboardTour />

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="learning" className="w-full mt-6">
          <TabsList className="flex flex-wrap gap-1 h-auto justify-start w-full lg:w-auto lg:inline-flex">
            <TabsTrigger value="learning" className="gap-2">
              <BookOpen className="h-4 w-4" />
              My Learning
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <LineChart className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            {isPartner && (
              <TabsTrigger value="partner" className="gap-2">
                <Handshake className="h-4 w-4" />
                Partner Portal
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="mt-6">
            {user?.id && <ContinueLearning userId={user.id} />}
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            {user?.id && <ProgressOverview userId={user.id} />}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            {user?.id && <Assignments userId={user.id} />}
          </TabsContent>

          <TabsContent value="certificates" className="mt-6">
            {user?.id && <Certificates userId={user.id} />}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {user?.id && <SavedCourses userId={user.id} />}
          </TabsContent>

          <TabsContent value="explore" className="mt-6">
            {user?.id && <AvailableProducts userId={user.id} />}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            {user?.id && <PaymentHistory userId={user.id} />}
          </TabsContent>

          {isPartner && (
            <TabsContent value="partner" className="mt-6">
              {user?.id && <PartnerPortalPanel userId={user.id} />}
            </TabsContent>
          )}

          <TabsContent value="profile" className="mt-6">
            <LearnerProfile profile={profile} onUpdate={checkAuthAndLoadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
