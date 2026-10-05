ALTER TABLE public.discount_code_redemptions
  ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS commission_status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS commission_status_updated_by uuid,
  ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz;

ALTER TABLE public.discount_code_redemptions
  DROP CONSTRAINT IF EXISTS discount_code_redemptions_commission_status_check;

ALTER TABLE public.discount_code_redemptions
  ADD CONSTRAINT discount_code_redemptions_commission_status_check
  CHECK (commission_status IN ('pending', 'approved', 'paid'));

UPDATE public.discount_code_redemptions SET commission_status = 'pending' WHERE commission_status IS NULL;

DROP POLICY IF EXISTS "Discount managers can update commission status" ON public.discount_code_redemptions;
CREATE POLICY "Discount managers can update commission status"
  ON public.discount_code_redemptions FOR UPDATE
  TO authenticated
  USING (public.can_manage_discounts())
  WITH CHECK (public.can_manage_discounts());

GRANT UPDATE ON public.discount_code_redemptions TO authenticated;
GRANT ALL ON public.discount_code_redemptions TO service_role;