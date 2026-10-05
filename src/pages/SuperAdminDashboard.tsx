import React, { useState, useEffect } from "react";
import AdminDashboardTour from "@/components/onboarding/AdminDashboardTour";
import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, Users } from "lucide-react";
import AdminUserManagement from "@/components/AdminUserManagement";
import { AffiliateManagement } from "@/components/admin/affiliate/AffiliateManagement";
import AdminPaymentsView from "@/components/admin/AdminPaymentsView";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import TallyFormsView from "@/components/admin/tally/TallyFormsView";
import CommandCenter from "@/components/admin/dashboard/CommandCenter";
import LiveCompletionsFeed from "@/components/admin/dashboard/LiveCompletionsFeed";

const SuperAdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "overview");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };
  return (
    <AdminDashboardLayout 
      title="Super Admin Dashboard" 
      subtitle="Track and manage your platform performance"
    >
      <AdminDashboardTour />
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-background">
              Payments
            </TabsTrigger>
            <TabsTrigger value="forms" className="data-[state=active]:bg-background">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-background">
              Users
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="data-[state=active]:bg-background">
              <Users className="h-4 w-4 mr-1.5" />
              Affiliates
            </TabsTrigger>
          </TabsList>

          <Button asChild>
            <Link to="/blog-editor/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Blog Post
            </Link>
          </Button>
        </div>
        
        <TabsContent value="overview" className="mt-0 space-y-6">
          <CommandCenter />
          <LiveCompletionsFeed />
        </TabsContent>

        
        <TabsContent value="payments" className="mt-0">
          <AdminPaymentsView />
        </TabsContent>

        <TabsContent value="forms" className="mt-0">
          <TallyFormsView />
        </TabsContent>
        
        <TabsContent value="users" className="mt-0">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="affiliates" className="mt-0">
          <AffiliateManagement />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default SuperAdminDashboard;
