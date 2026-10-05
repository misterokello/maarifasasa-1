
import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSignupSuccessProps {
  onGoToLogin: () => void;
}

const AdminSignupSuccess = ({ onGoToLogin }: AdminSignupSuccessProps) => {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold">Admin Account Created</h2>
      <p className="text-muted-foreground">
        Your admin account has been created successfully. Please check your email to confirm your account before logging in.
      </p>
      <Button onClick={onGoToLogin} className="mt-4">
        Go to Main Page
      </Button>
    </div>
  );
};

export default AdminSignupSuccess;
