-- Fix 1: Blog comments email exposure
-- Create a secure view that excludes author_email for public access
CREATE OR REPLACE VIEW public.public_blog_comments 
WITH (security_invoker = on) AS
SELECT 
  id, 
  post_id, 
  parent_id, 
  author_name, 
  content, 
  approved, 
  created_at
FROM public.blog_comments
WHERE approved = true;

-- Grant access to the view
GRANT SELECT ON public.public_blog_comments TO anon, authenticated;

-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;

-- Create a new restrictive SELECT policy - only blog admins can select from base table
CREATE POLICY "Only blog admins can view comments directly"
ON public.blog_comments
FOR SELECT
USING (can_manage_blog());

-- Fix 2: Drop overly permissive blog-images storage policies
DROP POLICY IF EXISTS "Authenticated users can upload Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Blog admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Blog admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Blog admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Blog admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Owner can update their Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete their Blog Images" ON storage.objects;

-- Create proper policies for blog images (without IF NOT EXISTS)
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Blog admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' AND
  (SELECT can_manage_blog())
);

CREATE POLICY "Blog admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND (SELECT can_manage_blog()));

CREATE POLICY "Blog admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND (SELECT can_manage_blog()));