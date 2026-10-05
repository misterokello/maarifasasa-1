import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnrollmentFunnel from "@/components/admin/learners/EnrollmentFunnel";
import SyncQueueMonitor from "@/components/admin/learners/SyncQueueMonitor";
import PathwaysManager from "@/components/admin/learners/PathwaysManager";
import AllLearners from "@/components/admin/learners/AllLearners";
import OnboardingData from "@/components/admin/learners/OnboardingData";
import CourseOutcomes from "@/components/admin/learners/CourseOutcomes";
import BulkLearnerImport from "@/components/admin/learners/BulkLearnerImport";
import PartnerAccessManager from "@/components/admin/learners/PartnerAccessManager";

const AdminLearners = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "all";

  return (
    <AdminDashboardLayout
      title="Learners"
      subtitle="Enrollment funnel, academy sync health, and curated learning pathways."
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All Learners</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding data</TabsTrigger>
          <TabsTrigger value="bulk">Bulk onboarding</TabsTrigger>
          <TabsTrigger value="outcomes">Course outcomes</TabsTrigger>
          <TabsTrigger value="partners">Partner portals</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="sync">Sync queue</TabsTrigger>
          <TabsTrigger value="pathways">Pathways</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <AllLearners />
        </TabsContent>
        <TabsContent value="onboarding" className="mt-6">
          <OnboardingData />
        </TabsContent>
        <TabsContent value="bulk" className="mt-6">
          <BulkLearnerImport />
        </TabsContent>
        <TabsContent value="outcomes" className="mt-6">
          <CourseOutcomes />
        </TabsContent>
        <TabsContent value="partners" className="mt-6">
          <PartnerAccessManager />
        </TabsContent>
        <TabsContent value="funnel" className="mt-6">
          <EnrollmentFunnel />
        </TabsContent>
        <TabsContent value="sync" className="mt-6">
          <SyncQueueMonitor />
        </TabsContent>
        <TabsContent value="pathways" className="mt-6">
          <PathwaysManager />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default AdminLearners;