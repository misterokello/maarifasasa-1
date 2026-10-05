
CREATE TABLE public.bulk_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_email TEXT,
  audience_label TEXT,
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT, INSERT, UPDATE ON public.bulk_email_log TO authenticated;
GRANT ALL ON public.bulk_email_log TO service_role;

ALTER TABLE public.bulk_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bulk email log"
ON public.bulk_email_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert bulk email log"
ON public.bulk_email_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender_id = auth.uid());

CREATE POLICY "Admins can update bulk email log"
ON public.bulk_email_log FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bulk_email_log_created_at ON public.bulk_email_log(created_at DESC);
CREATE INDEX idx_bulk_email_log_sender ON public.bulk_email_log(sender_id);
