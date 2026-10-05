-- Create table for tracking daily blog post views
CREATE TABLE public.blog_post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, view_date)
);

-- Enable RLS
ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert/update views (for tracking)
CREATE POLICY "Anyone can track views"
ON public.blog_post_views
FOR INSERT
WITH CHECK (true);

-- Policy: Allow upsert updates for view counting
CREATE POLICY "Anyone can increment views"
ON public.blog_post_views
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Blog admins can view all analytics
CREATE POLICY "Blog admins can view analytics"
ON public.blog_post_views
FOR SELECT
USING (can_manage_blog());

-- Policy: Public can view aggregated data (for public stats if needed)
CREATE POLICY "Anyone can view view counts"
ON public.blog_post_views
FOR SELECT
USING (true);

-- Create index for efficient querying by date
CREATE INDEX idx_blog_post_views_date ON public.blog_post_views(view_date);
CREATE INDEX idx_blog_post_views_post_id ON public.blog_post_views(post_id);

-- Create function to increment daily views (upsert)
CREATE OR REPLACE FUNCTION public.increment_daily_post_views(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.blog_post_views (post_id, view_date, view_count)
  VALUES (p_post_id, CURRENT_DATE, 1)
  ON CONFLICT (post_id, view_date)
  DO UPDATE SET 
    view_count = blog_post_views.view_count + 1,
    updated_at = now();
  
  -- Also update the total views on the blog_posts table
  UPDATE public.blog_posts
  SET views = views + 1
  WHERE id = p_post_id AND published = true;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_blog_post_views_updated_at
BEFORE UPDATE ON public.blog_post_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();