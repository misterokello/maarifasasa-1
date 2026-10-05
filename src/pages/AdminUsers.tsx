import React from "react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import ThinkificUsersList from "@/components/admin/thinkific/ThinkificUsersList";

const AdminUsers = () => {
  return (
    <AdminDashboardLayout
      title="Academy Users"
      subtitle="All learners synced from the academy. Click a user to view full profile, enrollments and progress."
    >
      <ThinkificUsersList />
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
