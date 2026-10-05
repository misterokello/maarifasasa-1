
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ForgotPasswordTabProps {
  setActiveTab: (tab: "login" | "forgotPassword" | "forgotEmail") => void;
}

const ForgotPasswordTab = ({ setActiveTab }: ForgotPasswordTabProps) => {
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Failed to send password reset email");
      } else {
        toast.success("Password reset email sent. Please check your inbox.");
        setActiveTab("login");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePasswordReset();
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-2 -ml-2 text-muted-foreground"
        onClick={() => setActiveTab("login")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to login
      </Button>
      
      <div>
        <Label htmlFor="resetEmail" className="mb-2 block">
          Email Address
        </Label>
        <Input
          id="resetEmail"
          type="email"
          placeholder="Enter your email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      
      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        <AlertCircle className="h-4 w-4 inline-block mr-2 text-amber-500" />
        We'll send a password reset link to this email address if it's associated with an admin account.
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handlePasswordReset} 
          disabled={loading || !resetEmail}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : "Send Reset Link"}
        </Button>
      </div>
    </div>
  );
};

export default ForgotPasswordTab;
