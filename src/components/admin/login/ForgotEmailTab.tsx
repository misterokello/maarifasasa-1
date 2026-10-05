
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ForgotEmailTabProps {
  setActiveTab: (tab: "login" | "forgotPassword" | "forgotEmail") => void;
}

const ForgotEmailTab = ({ setActiveTab }: ForgotEmailTabProps) => {
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFindAccount = async () => {
    setLoading(true);
    // In a real application, this would connect to a backend service
    // that would look up the account by phone number and send a notification
    setTimeout(() => {
      toast.success("If this phone number is associated with an admin account, you will receive a notification.");
      setActiveTab("login");
      setLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFindAccount();
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
        <Label htmlFor="recoveryPhone" className="mb-2 block">
          Phone Number
        </Label>
        <Input
          id="recoveryPhone"
          type="tel"
          placeholder="Enter your phone number"
          value={recoveryPhone}
          onChange={(e) => setRecoveryPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      
      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
        <AlertCircle className="h-4 w-4 inline-block mr-2 text-amber-500" />
        If this phone is associated with an admin account, we'll send you a notification with your account email.
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleFindAccount} 
          disabled={loading || !recoveryPhone}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : "Find Account"}
        </Button>
      </div>
    </div>
  );
};

export default ForgotEmailTab;
