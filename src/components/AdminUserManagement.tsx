
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateAdminForm from "./admin/CreateAdminForm";
import AdminSignupForm from "./admin/AdminSignupForm";
import AdminUsersList from "./admin/AdminUsersList";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const AdminUserManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState("list");
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    if (tabParam === 'signup') {
      setActiveTab('signup');
      setShowAddForm(true);
    }
  }, [tabParam]);

  const handleAddClick = () => {
    setShowAddForm(true);
    setActiveTab("create");
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== "create" && value !== "signup") {
      setShowAddForm(false);
    }
    
    // Update URL query parameter
    if (value === 'signup') {
      navigate('/admin-users?tab=signup');
    } else {
      navigate('/admin-users');
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Admin User Management</CardTitle>
            <CardDescription>
              Manage admin users for your application
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button onClick={handleAddClick} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Admin
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Admin Users</TabsTrigger>
            <TabsTrigger value="create">Create Admin</TabsTrigger>
            <TabsTrigger value="signup">Direct Signup</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <AdminUsersList />
          </TabsContent>

          <TabsContent value="create">
            <CreateAdminForm onSuccess={() => {
              setShowAddForm(false);
              setActiveTab("list");
            }} />
          </TabsContent>
          
          <TabsContent value="signup">
            <AdminSignupForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminUserManagement;
