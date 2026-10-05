-- Backfill user_id on existing payments by matching payer_email to a profile
UPDATE public.payments p
SET user_id = pr.id
FROM public.profiles pr
WHERE p.user_id IS NULL
  AND p.payer_email IS NOT NULL
  AND lower(trim(p.payer_email)) = lower(trim(pr.email));

-- Auto-link future payments to accounts by email
CREATE OR REPLACE FUNCTION public.link_payment_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.payer_email IS NOT NULL THEN
    SELECT pr.id INTO NEW.user_id
    FROM public.profiles pr
    WHERE lower(trim(pr.email)) = lower(trim(NEW.payer_email))
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_payment_to_user ON public.payments;
CREATE TRIGGER trg_link_payment_to_user
BEFORE INSERT OR UPDATE OF payer_email ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.link_payment_to_user();

-- Allow learners to also see payments made with their own email address
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (
    payer_email IS NOT NULL
    AND lower(trim(payer_email)) = (SELECT lower(trim(u.email)) FROM auth.users u WHERE u.id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);