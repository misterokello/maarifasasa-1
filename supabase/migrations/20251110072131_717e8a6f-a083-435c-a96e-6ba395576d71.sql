-- Create blog images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Create RLS policies for blog images bucket
CREATE POLICY "Blog admins can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' AND
  (SELECT can_manage_blog())
);

CREATE POLICY "Blog admins can update images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images' AND
  (SELECT can_manage_blog())
);

CREATE POLICY "Blog admins can delete images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images' AND
  (SELECT can_manage_blog())
);

CREATE POLICY "Anyone can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');