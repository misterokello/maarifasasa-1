DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'blog_comments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.blog_comments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.payments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tally_submissions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.tally_submissions';
  END IF;
END $$;