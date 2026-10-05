
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AdminSignupSuccess from "./signup/AdminSignupSuccess";
import AdminSignupFormFields from "./signup/AdminSignupFormFields";
import { validateSignupForm, type AdminSignupData } from "./signup/AdminSignupValidation";

const AdminSignupForm = () => {
  const [formData, setFormData] = useState<AdminSignupData>({
    email: "",
    password: "",
    confirmPassword: "",
    secret: ""
  });
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-admin-exists');
        if (!error && data) {
          setAdminExists(data.exists === true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdminExists();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateSignupForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = adminExists === false 
        ? { email: formData.email, password: formData.password } 
        : { email: formData.email, password: formData.password, secret: formData.secret };
      
      const { data, error } = await supabase.functions.invoke('add-admin-user', {
        body: payload
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || "Failed to create admin user");
      }
      
      toast.success("Admin user created successfully!");
      toast.info("You will need to confirm your email address before logging in.");
      
      setSignupSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        secret: ""
      });
      
    } catch (err: any) {
      console.error('Error creating admin:', err);
      toast.error(err.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/learning");
  };

  if (signupSuccess) {
    return <AdminSignupSuccess onGoToLogin={handleGoToLogin} />;
  }

  return (
    <AdminSignupFormFields
      formData={formData}
      setFormData={setFormData}
      adminExists={adminExists}
      loading={loading}
      onSubmit={handleSignup}
    />
  );
};

export default AdminSignupForm;
