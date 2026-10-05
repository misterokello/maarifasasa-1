CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(btrim(u.email::text)) FROM auth.users u WHERE u.id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = (SELECT auth.uid()))
  OR (payer_email IS NOT NULL AND lower(btrim(payer_email)) = (SELECT public.current_user_email()))
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can view documents for their own payments" ON public.payment_documents;
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
        OR lower(btrim(p.payer_email)) = (SELECT public.current_user_email())
      )
  )
);