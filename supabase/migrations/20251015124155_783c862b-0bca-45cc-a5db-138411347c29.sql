-- Fix Critical RLS Infinite Recursion Issue
-- Create a SECURITY DEFINER function that bypasses RLS to check admin status

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- Drop the existing recursive policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Create new policies using the SECURITY DEFINER function
CREATE POLICY "Admins can view admin users"
ON admin_users FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage admin users"
ON admin_users FOR ALL
USING (public.is_admin());

-- Update other tables to use the new is_admin() function instead of recursive queries
DROP POLICY IF EXISTS "Admins can manage categories" ON blog_categories;
CREATE POLICY "Admins can manage categories"
ON blog_categories FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage posts" ON blog_posts;
CREATE POLICY "Admins can manage posts"
ON blog_posts FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
CREATE POLICY "Anyone can view published posts"
ON blog_posts FOR SELECT
USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage comments" ON blog_comments;
CREATE POLICY "Admins can manage comments"
ON blog_comments FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view approved comments" ON blog_comments;
CREATE POLICY "Anyone can view approved comments"
ON blog_comments FOR SELECT
USING (approved = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses"
ON courses FOR ALL
USING (public.is_admin());