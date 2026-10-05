-- Add parent_id column to blog_comments for reply threading
ALTER TABLE public.blog_comments 
ADD COLUMN parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_id);
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);