import React from "react";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import SystemAccessManager from "@/components/admin/access/SystemAccessManager";

const AdminAccess = () => {
  return (
    <AdminDashboardLayout
      title="Access Control"
      subtitle="Manage who can access each module of the platform"
    >
      <SystemAccessManager />
    </AdminDashboardLayout>
  );
};

export default AdminAccess;