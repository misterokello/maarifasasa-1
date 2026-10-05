import React, { useState } from "react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EngagementDashboard from "@/components/admin/engagement/EngagementDashboard";
import CampaignsList from "@/components/admin/engagement/CampaignsList";
import TemplatesManager from "@/components/admin/engagement/TemplatesManager";
import AudiencesManager from "@/components/admin/engagement/AudiencesManager";
import ResendStatusCard from "@/components/admin/engagement/ResendStatusCard";

const AdminEngagement: React.FC = () => {
  const [tab, setTab] = useState("dashboard");
  return (
    <AdminDashboardLayout title="Engagement" subtitle="Email campaigns, templates and audiences for your learners.">
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><EngagementDashboard /></TabsContent>
        <TabsContent value="campaigns"><CampaignsList /></TabsContent>
        <TabsContent value="templates"><TemplatesManager /></TabsContent>
        <TabsContent value="audiences"><AudiencesManager /></TabsContent>
        <TabsContent value="settings">
          <div className="max-w-xl"><ResendStatusCard /></div>
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default AdminEngagement;