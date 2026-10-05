import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { BarChart3, Phone, BookmarkCheck, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import AdvisorAnalyticsView from "@/components/admin/advisor/AdvisorAnalyticsView";
import MentorCallsView from "@/components/admin/advisor/MentorCallsView";
import SavedPathwaysView from "@/components/admin/advisor/SavedPathwaysView";
import AdvisorChatsView from "@/components/admin/advisor/AdvisorChatsView";
import AdvisorSettingsView from "@/components/admin/advisor/AdvisorSettingsView";

export default function AdminAdvisorDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "analytics";

  const [active, setActive] = useState(tab);
  useEffect(() => setActive(tab), [tab]);

  const onChange = (v: string) => {
    setActive(v);
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <AdminDashboardLayout
      title="AI Pathway Advisor"
      subtitle="Manage assessments, mentor calls, and learner journeys"
    >
      <Tabs value={active} onValueChange={onChange}>
        <TabsList className="bg-muted/50 mb-6 flex flex-wrap h-auto">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="mentor-calls" className="data-[state=active]:bg-background">
            <Phone className="h-4 w-4 mr-1.5" /> Mentor calls
          </TabsTrigger>
          <TabsTrigger value="pathways" className="data-[state=active]:bg-background">
            <BookmarkCheck className="h-4 w-4 mr-1.5" /> Saved pathways
          </TabsTrigger>
          <TabsTrigger value="chats" className="data-[state=active]:bg-background">
            <MessageSquare className="h-4 w-4 mr-1.5" /> Chat transcripts
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-background">
            <SettingsIcon className="h-4 w-4 mr-1.5" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0">
          <AdvisorAnalyticsView />
        </TabsContent>
        <TabsContent value="mentor-calls" className="mt-0">
          <MentorCallsView />
        </TabsContent>
        <TabsContent value="pathways" className="mt-0">
          <SavedPathwaysView />
        </TabsContent>
        <TabsContent value="chats" className="mt-0">
          <AdvisorChatsView />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <AdvisorSettingsView />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
}
