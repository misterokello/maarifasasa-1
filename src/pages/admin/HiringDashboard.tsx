import React from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import HiringOverview from "@/components/admin/hiring/HiringOverview";
import RecruitmentRequestsManager from "@/components/admin/hiring/RecruitmentRequestsManager";
import JobPostingsManager from "@/components/admin/hiring/JobPostingsManager";
import ApplicantsManager from "@/components/admin/hiring/ApplicantsManager";
import InterviewsManager from "@/components/admin/hiring/InterviewsManager";
import ChecksManager from "@/components/admin/hiring/ChecksManager";
import OffersManager from "@/components/admin/hiring/OffersManager";
import AuditLogViewer from "@/components/admin/hiring/AuditLogViewer";

const HiringDashboard = () => {
  return (
    <AdminDashboardLayout
      title="Hiring"
      subtitle="Manage recruitment requests, postings, applicants, interviews, checks and offers per the Maarifasasa Recruitment & Selection Policy."
    >
      <Helmet>
        <title>Hiring — Admin</title>
      </Helmet>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="postings">Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><HiringOverview /></TabsContent>
        <TabsContent value="requests"><RecruitmentRequestsManager /></TabsContent>
        <TabsContent value="postings"><JobPostingsManager /></TabsContent>
        <TabsContent value="applicants"><ApplicantsManager /></TabsContent>
        <TabsContent value="interviews"><InterviewsManager /></TabsContent>
        <TabsContent value="checks"><ChecksManager /></TabsContent>
        <TabsContent value="offers"><OffersManager /></TabsContent>
        <TabsContent value="audit"><AuditLogViewer /></TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default HiringDashboard;