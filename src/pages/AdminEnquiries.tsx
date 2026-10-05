import React from "react";
import { useSearchParams } from "react-router-dom";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DemoRequestsTable from "@/components/admin/enquiries/DemoRequestsTable";
import LearnerEnquiriesTable from "@/components/admin/enquiries/LearnerEnquiriesTable";

const AdminEnquiries = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "demos";

  return (
    <AdminDashboardLayout
      title="Enquiries"
      subtitle="Enterprise demo requests and learner enquiries with statuses, timestamps and contact details."
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="demos">Enterprise demos</TabsTrigger>
          <TabsTrigger value="learners">Learner enquiries</TabsTrigger>
        </TabsList>
        <TabsContent value="demos" className="mt-6">
          <DemoRequestsTable />
        </TabsContent>
        <TabsContent value="learners" className="mt-6">
          <LearnerEnquiriesTable />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default AdminEnquiries;
