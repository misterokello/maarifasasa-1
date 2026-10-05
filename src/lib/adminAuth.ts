
import { supabase } from "@/integrations/supabase/client";

// Admin authentication using Supabase
export const ADMIN_AUTH_KEY = "admin_authenticated";

// Check if the current user is an admin
export async function isAdminAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return false;
  }
  
  try {
    // Use the check_if_admin function with correct parameter name
    const { data, error } = await supabase.rpc('check_if_admin', {
      check_user_id: session.user.id
    });
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Login as admin
export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Attempting to login with email:", email);
    
    // First, authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Authentication error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Authentication successful, checking admin status...");
    
    // Check if the user is an admin
    const isAdmin = await isAdminAuthenticated();
    
    console.log("Is admin check result:", isAdmin);
    
    if (!isAdmin) {
      // User is authenticated but not an admin, sign them out
      console.log("User authenticated but not an admin, signing out");
      await supabase.auth.signOut();
      return { success: false, error: "User is not an admin" };
    }

    console.log("Admin login successful");
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Logout admin
export async function logoutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Find admin account by phone (mock implementation)
export async function findAdminAccountByPhone(phone: string): Promise<{ success: boolean; email?: string; error?: string }> {
  // In a real implementation, this would call a secure backend endpoint
  // For now, this is just a mock that always succeeds
  return { success: true };
}

// Get admin users with basic information
export async function getAdminUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

// Remove admin role from a user
export async function removeAdminRole(adminId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error removing admin role:", error);
    return false;
  }
}
