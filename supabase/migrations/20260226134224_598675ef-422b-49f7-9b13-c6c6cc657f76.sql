
-- Fix payments SELECT policy to prevent PII exposure for non-owners
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
