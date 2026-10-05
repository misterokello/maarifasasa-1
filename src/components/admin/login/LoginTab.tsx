
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { loginAdmin } from "@/lib/adminAuth";
import { toast } from "sonner";

interface LoginTabProps {
  onOpenChange: (open: boolean) => void;
  setActiveTab: (tab: "login" | "forgotPassword" | "forgotEmail") => void;
}

const LoginTab = ({ onOpenChange, setActiveTab }: LoginTabProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    console.log("Login attempt with email:", email);
    
    try {
      const { success, error } = await loginAdmin(email, password);
      
      if (success) {
        toast.success("Logged in as admin");
        onOpenChange(false);
        navigate("/super-admin-dashboard");
      } else {
        console.error("Login failed:", error);
        toast.error(error || "Invalid admin credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleSignupClick = () => {
    // Close the dialog before navigating
    onOpenChange(false);
    // Navigate to the admin users page with the signup tab query parameter
    navigate("/admin-users?tab=signup");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password">Password</Label>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs"
            onClick={() => setActiveTab("forgotPassword")}
          >
            Forgot password?
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      <div className="text-center">
        <Button 
          variant="link" 
          className="p-0 h-auto text-xs"
          onClick={() => setActiveTab("forgotEmail")}
        >
          Forgot which email you used?
        </Button>
      </div>
      
      <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
        <p className="text-xs text-amber-700 mb-2">
          Need an admin account? Sign up directly:
        </p>
        <Button 
          onClick={handleSignupClick}
          className="w-full"
          variant="outline"
          size="sm"
        >
          Go to Admin Signup
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleLogin} 
          disabled={loading || !email || !password}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : "Login"}
        </Button>
      </div>
    </div>
  );
};

export default LoginTab;
