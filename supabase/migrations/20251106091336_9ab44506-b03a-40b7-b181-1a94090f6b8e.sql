-- Add views column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0 NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON public.blog_posts(views DESC);

-- Create a function to increment post views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views = views + 1
  WHERE slug = post_slug AND published = true;
END;
$$;