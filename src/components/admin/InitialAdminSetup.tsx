
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InitialAdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateInitialAdmin = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('add-admin-user', {
        body: { email, password }
      });
      
      if (error) {
        console.error('Error creating initial admin user:', error);
        toast.error(error.message || "Failed to create admin user");
        return;
      }
      
      if (data?.success) {
        toast.success("Initial admin user created successfully!");
        toast.info("You can now log in with the credentials you provided.");
        setEmail("");
        setPassword("");
      } else {
        toast.error(data?.error || "Unexpected response from server");
      }
      
    } catch (err) {
      console.error('Error:', err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
        <h3 className="text-sm font-medium text-amber-800 mb-2">Initial Admin Setup</h3>
        <p className="text-sm text-amber-700 mb-4">
          Enter the email and a strong password for your first admin account.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="admin-email" className="text-sm text-amber-800">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admin-password" className="text-sm text-amber-800">Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleCreateInitialAdmin}
        className="w-full"
        variant="outline"
        disabled={loading || !email || !password}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Initial Admin...
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-4 w-4" />
            Create Initial Admin User
          </>
        )}
      </Button>
    </div>
  );
};

export default InitialAdminSetup;
