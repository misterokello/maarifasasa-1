import React from "react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import ThinkificUserDetail from "@/components/admin/thinkific/ThinkificUserDetail";

const AdminUserDetail = () => {
  return (
    <AdminDashboardLayout
      title="User Profile"
      subtitle="Full Thinkific profile, enrollments and course progress"
    >
      <ThinkificUserDetail />
    </AdminDashboardLayout>
  );
};

export default AdminUserDetail;