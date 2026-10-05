
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserPlus, InfoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateAdminFormProps {
  onSuccess?: () => void;
}

const CreateAdminForm = ({ onSuccess }: CreateAdminFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if any admin users already exist
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-admin-users');
        if (!error && data) {
          setAdminExists(data.length > 0);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdminExists();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    
    setLoading(true);
    
    try {
      // If no admins exist yet, don't require the secret
      const payload = adminExists === false 
        ? { email, password } 
        : { email, password, secret };
      
      const { data, error } = await supabase.functions.invoke('add-admin-user', {
        body: payload
      });
      
      if (error) {
        console.error('Error invoking function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Failed to create admin user");
      }
      
      toast.success("Admin user created successfully!");
      // Reset form
      setEmail("");
      setPassword("");
      setSecret("");
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddAdmin} className="space-y-4">
      {adminExists === false && (
        <Alert className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-700">
            No admin users exist yet. You can create the first admin without providing a secret.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Temporary secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          The user should change this password after first login
        </p>
      </div>
      
      {adminExists !== false && (
        <div className="space-y-2">
          <Label htmlFor="secret">Admin Setup Secret</Label>
          <Input
            id="secret"
            type="password"
            placeholder="Your admin setup secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required={adminExists === true}
          />
          <p className="text-xs text-muted-foreground">
            This is the secret configured in your Supabase Edge Function settings
          </p>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full mt-4"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Admin...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Admin User
          </>
        )}
      </Button>
    </form>
  );
};

export default CreateAdminForm;
