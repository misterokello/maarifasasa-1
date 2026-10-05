-- Add thinkific_course_id column to products table for Thinkific integration
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS thinkific_course_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.products.thinkific_course_id IS 'Thinkific course ID for automatic enrollment after payment';