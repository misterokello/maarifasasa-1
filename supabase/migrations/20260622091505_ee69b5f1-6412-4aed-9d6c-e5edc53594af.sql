ALTER TABLE public.bulk_email_log ADD COLUMN IF NOT EXISTS batch_id uuid;
CREATE INDEX IF NOT EXISTS idx_bulk_email_log_batch_id ON public.bulk_email_log(batch_id);
ALTER TABLE public.bulk_email_log REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bulk_email_log'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_email_log';
  END IF;
END $$;