
import React from "react";
import LoginTab from "./LoginTab";
import ForgotPasswordTab from "./ForgotPasswordTab";
import ForgotEmailTab from "./ForgotEmailTab";

interface AdminLoginTabsProps {
  activeTab: "login" | "forgotPassword" | "forgotEmail";
  setActiveTab: (tab: "login" | "forgotPassword" | "forgotEmail") => void;
  onOpenChange: (open: boolean) => void;
}

const AdminLoginTabs = ({ 
  activeTab, 
  setActiveTab,
  onOpenChange
}: AdminLoginTabsProps) => {
  return (
    <div className="py-4">
      {activeTab === "login" && (
        <LoginTab 
          onOpenChange={onOpenChange}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "forgotPassword" && (
        <ForgotPasswordTab setActiveTab={setActiveTab} />
      )}

      {activeTab === "forgotEmail" && (
        <ForgotEmailTab setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export default AdminLoginTabs;
