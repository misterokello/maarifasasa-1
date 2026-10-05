-- Add meta_image column to blog_posts table for custom OG image
ALTER TABLE public.blog_posts
ADD COLUMN meta_image text;