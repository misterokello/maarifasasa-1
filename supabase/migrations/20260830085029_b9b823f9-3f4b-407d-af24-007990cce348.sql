ALTER TABLE public.payment_documents
  ADD COLUMN IF NOT EXISTS generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'not_attempted',
  ADD COLUMN IF NOT EXISTS email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS email_message_id text,
  ADD COLUMN IF NOT EXISTS email_to text;

ALTER TABLE public.payment_documents ALTER COLUMN storage_path DROP NOT NULL;

UPDATE public.payment_documents
SET email_status = 'sent'
WHERE emailed_at IS NOT NULL AND email_status = 'not_attempted';

CREATE INDEX IF NOT EXISTS idx_payment_documents_payment_id ON public.payment_documents (payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_documents_email_status ON public.payment_documents (email_status);