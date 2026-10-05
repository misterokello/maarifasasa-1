-- Add duration, start_date, end_date columns to products table for bootcamp and certificate management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date;

-- Add comment for documentation
COMMENT ON COLUMN public.products.duration IS 'Duration of the product (e.g., "3 weeks", "12 weeks", "self-paced")';
COMMENT ON COLUMN public.products.start_date IS 'Start date for time-bound products like bootcamps';
COMMENT ON COLUMN public.products.end_date IS 'End date for time-bound products like bootcamps';

-- Update existing products with appropriate category values
UPDATE public.products SET category = 'program' WHERE category IS NULL OR category = '';

-- Insert sample certificate courses if they don't exist
INSERT INTO public.products (name, slug, description, category, price_ugx, price_usd, duration, is_active)
VALUES 
  ('Introduction to AI', 'intro-to-ai', 'Learn the fundamentals of Artificial Intelligence', 'certificate', 20000, 6, 'Self-paced', true),
  ('AI Creative Collaboration', 'ai-creative-collaboration', 'Master AI tools for creative work', 'certificate', 25000, 7, 'Self-paced', true),
  ('Virtual Assistance', 'virtual-assistance', 'Become a professional virtual assistant', 'certificate', 30000, 8, '4 weeks', true),
  ('Prompt Engineering', 'prompt-engineering', 'Learn to craft effective AI prompts', 'certificate', 35000, 10, 'Self-paced', true),
  ('Web Development', 'web-development', 'Build modern websites from scratch', 'certificate', 50000, 15, '8 weeks', true),
  ('Agile Project Management', 'agile-project-management', 'Master Agile methodologies', 'certificate', 40000, 12, '6 weeks', true),
  ('Digital Marketing', 'digital-marketing', 'Learn digital marketing strategies', 'certificate', 45000, 13, '6 weeks', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample bootcamp cohorts if they don't exist
INSERT INTO public.products (name, slug, description, category, price_ugx, price_usd, duration, start_date, end_date, is_active)
VALUES 
  ('S.4 Leavers'' Bootcamp', 's4-leavers-bootcamp', 'Intensive bootcamp for S.4 leavers to build digital skills', 'bootcamp', 350000, 95, '3 weeks', '2026-01-26', '2026-02-13', true),
  ('S.6 Leavers'' Bootcamp', 's6-leavers-bootcamp', 'Comprehensive bootcamp for S.6 leavers preparing for the digital economy', 'bootcamp', 700000, 190, '6 weeks', '2026-02-01', '2026-03-15', true)
ON CONFLICT (slug) DO NOTHING;