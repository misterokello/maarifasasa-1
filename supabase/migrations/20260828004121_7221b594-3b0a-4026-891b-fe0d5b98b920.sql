CREATE TABLE public.payment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('invoice','receipt')),
  doc_number TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  amount NUMERIC,
  currency TEXT,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  emailed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (payment_id, doc_type),
  UNIQUE (doc_number)
);

CREATE INDEX idx_payment_documents_payment ON public.payment_documents(payment_id);

GRANT SELECT ON public.payment_documents TO authenticated;
GRANT ALL ON public.payment_documents TO service_role;

ALTER TABLE public.payment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for their own payments"
ON public.payment_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.id = payment_documents.payment_id
      AND (
        p.user_id = (SELECT auth.uid())
        OR lower(trim(p.payer_email)) = (SELECT lower(trim(u.email)) FROM auth.users u WHERE u.id = (SELECT auth.uid()))
      )
  )
);

CREATE POLICY "Admins can view all payment documents"
ON public.payment_documents
FOR SELECT
TO authenticated
USING ((SELECT public.has_role(auth.uid(), 'admin'::app_role)) OR (SELECT public.has_role(auth.uid(), 'payments_admin'::app_role)));

CREATE TRIGGER trg_payment_documents_updated
BEFORE UPDATE ON public.payment_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();