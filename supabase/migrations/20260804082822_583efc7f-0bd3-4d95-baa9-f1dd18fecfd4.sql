-- 1. Restrict affiliate commission visibility to approved affiliates
DROP POLICY IF EXISTS "Authenticated users can view active affiliate products" ON public.affiliate_products;

CREATE POLICY "Approved affiliates can view active affiliate products"
ON public.affiliate_products
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.user_id = auth.uid()
      AND a.status = 'approved'
  )
);

-- 2. Remove sensitive tables from the realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'blog_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.blog_comments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.payments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tally_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.tally_submissions;
  END IF;
END $$;