CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);
CREATE INDEX IF NOT EXISTS payments_method_idx ON public.payments (payment_method);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_payer_email_lower_idx ON public.payments (lower(btrim(payer_email)));

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = (SELECT auth.uid()))
    OR (payer_email IS NOT NULL AND lower(btrim(payer_email)) = (SELECT lower(btrim(u.email)) FROM auth.users u WHERE u.id = (SELECT auth.uid())))
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );