import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Rocket, GraduationCap, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import ProductsTableView from "@/components/admin/products/ProductsTableView";
import ThinkificEnrollments from "@/components/admin/thinkific/ThinkificEnrollments";

const AdminCourses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "certificates");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "certificates") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  return (
    <AdminDashboardLayout
      title="Product Management"
      subtitle="Manage certificates, bootcamps, programs, and course enrollments"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50">
          <TabsTrigger
            value="certificates"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Certificates</span>
          </TabsTrigger>
          <TabsTrigger
            value="bootcamps"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Bootcamps</span>
          </TabsTrigger>
          <TabsTrigger
            value="programs"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Programs</span>
          </TabsTrigger>
          <TabsTrigger
            value="enrollments"
            className="flex items-center gap-2 data-[state=active]:bg-background"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Enrollments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-6">
          <ProductsTableView
            category="certificate"
            title="Certificate Courses"
            description="Manage certificate courses with auto-generated checkout links for payments"
            defaultProductName="New Certificate Course"
          />
        </TabsContent>

        <TabsContent value="bootcamps" className="mt-6">
          <ProductsTableView
            category="bootcamp"
            title="Bootcamp Cohorts"
            description="Manage bootcamp cohorts with dates, durations, and auto-generated checkout links"
            defaultProductName="New Bootcamp Cohort"
          />
        </TabsContent>

        <TabsContent value="programs" className="mt-6">
          <ProductsTableView
            category="program"
            title="Talent Accelerator & Programs"
            description="Manage flagship programs like Talent Accelerator with auto-generated checkout links"
            defaultProductName="New Program"
          />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <ThinkificEnrollments />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default AdminCourses;
