-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'blog_admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is blog admin or admin
CREATE OR REPLACE FUNCTION public.can_manage_blog()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'blog_admin')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Update blog_posts RLS policies
DROP POLICY IF EXISTS "Admins can manage posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;

CREATE POLICY "Blog admins can manage posts"
ON public.blog_posts
FOR ALL
USING (can_manage_blog());

CREATE POLICY "Anyone can view published posts"
ON public.blog_posts
FOR SELECT
USING (published = true OR can_manage_blog());

-- Update blog_categories RLS policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.blog_categories;

CREATE POLICY "Blog admins can manage categories"
ON public.blog_categories
FOR ALL
USING (can_manage_blog());

CREATE POLICY "Anyone can view categories"
ON public.blog_categories
FOR SELECT
USING (true);

-- Update blog_comments RLS policies
DROP POLICY IF EXISTS "Admins can manage comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON public.blog_comments;

CREATE POLICY "Blog admins can manage comments"
ON public.blog_comments
FOR ALL
USING (can_manage_blog());

CREATE POLICY "Anyone can view approved comments"
ON public.blog_comments
FOR SELECT
USING (approved = true OR can_manage_blog());

CREATE POLICY "Anyone can create comments"
ON public.blog_comments
FOR INSERT
WITH CHECK (true);