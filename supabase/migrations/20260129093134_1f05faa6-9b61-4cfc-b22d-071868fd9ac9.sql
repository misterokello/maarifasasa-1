-- Add optional thinkific_course_url column to products table
ALTER TABLE public.products
ADD COLUMN thinkific_course_url text DEFAULT NULL;