
-- Create a storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for blog images
-- Anyone can read blog images (public bucket)
CREATE POLICY "Anyone can view blog images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

-- Only blog admins can upload blog images
CREATE POLICY "Blog admins can upload blog images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND (SELECT can_manage_blog()));

-- Only blog admins can update blog images
CREATE POLICY "Blog admins can update blog images" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'blog-images' AND (SELECT can_manage_blog()));

-- Only blog admins can delete blog images
CREATE POLICY "Blog admins can delete blog images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'blog-images' AND (SELECT can_manage_blog()));
