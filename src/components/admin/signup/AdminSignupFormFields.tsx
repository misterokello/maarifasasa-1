
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlusIcon, InfoIcon } from "lucide-react";
import type { AdminSignupData } from "./AdminSignupValidation";

interface AdminSignupFormFieldsProps {
  formData: AdminSignupData;
  setFormData: React.Dispatch<React.SetStateAction<AdminSignupData>>;
  adminExists: boolean | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const AdminSignupFormFields = ({
  formData,
  setFormData,
  adminExists,
  loading,
  onSubmit
}: AdminSignupFormFieldsProps) => {
  return (
    <div className="space-y-6">
      {adminExists === false && (
        <Alert className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-700">
            No admin users exist yet. You can create the first admin user without providing a secret.
          </AlertDescription>
        </Alert>
      )}
      
      {adminExists !== false && (
        <Alert>
          <AlertDescription>
            Sign up directly as an admin user. You will need to confirm your email address before logging in.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters long
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        </div>
        
        {adminExists !== false && (
          <div className="space-y-2">
            <Label htmlFor="secret">Admin Setup Secret</Label>
            <Input
              id="secret"
              type="password"
              placeholder="Admin setup secret"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              required={adminExists === true}
            />
            <p className="text-xs text-muted-foreground">
              The secret configured in your Supabase Edge Function settings
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
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Sign Up as Admin
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default AdminSignupFormFields;
