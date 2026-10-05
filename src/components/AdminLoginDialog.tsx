
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLoginTabs from "./admin/login/AdminLoginTabs";

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminLoginDialog = ({ open, onOpenChange }: AdminLoginDialogProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "forgotPassword" | "forgotEmail">("login");

  // Reset to login tab when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      // Small delay to avoid visual flicker during close animation
      setTimeout(() => setActiveTab("login"), 300);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {activeTab === "login" && "Admin Login"}
            {activeTab === "forgotPassword" && "Reset Password"}
            {activeTab === "forgotEmail" && "Find Your Admin Account"}
          </DialogTitle>
          <DialogDescription>
            {activeTab === "login" && "Enter your admin credentials to access the dashboard."}
            {activeTab === "forgotPassword" && "We'll send you an email with a reset link."}
            {activeTab === "forgotEmail" && "Enter your phone number to find your account."}
          </DialogDescription>
        </DialogHeader>
        
        <AdminLoginTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginDialog;
