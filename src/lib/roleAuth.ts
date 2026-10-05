import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has a specific role
 */
export const hasRole = async (role: 'admin' | 'blog_admin' | 'user'): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', role)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking role:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasRole:', error);
    return false;
  }
};

/**
 * Check if the current user can manage blog content (blog_admin or admin)
 */
export const canManageBlog = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .in('role', ['admin', 'blog_admin']);

    if (error) {
      console.error('Error checking blog management permission:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in canManageBlog:', error);
    return false;
  }
};

/**
 * Check if the current user is a full admin
 */
export const isFullAdmin = async (): Promise<boolean> => {
  return hasRole('admin');
};
