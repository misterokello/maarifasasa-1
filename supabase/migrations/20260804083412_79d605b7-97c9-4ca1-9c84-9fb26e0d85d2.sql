CREATE OR REPLACE FUNCTION public.can_manage_payouts()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'affiliate_admin'::app_role, 'discount_admin'::app_role, 'payments_admin'::app_role)
  )
$$;

CREATE TABLE public.affiliate_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  referrer_label text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  method text,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  period_start date,
  period_end date,
  paid_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_payouts_status_check CHECK (status IN ('pending', 'paid', 'failed')),
  CONSTRAINT affiliate_payouts_referrer_check CHECK (affiliate_id IS NOT NULL OR discount_code_id IS NOT NULL)
);

CREATE INDEX idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_code ON public.affiliate_payouts(discount_code_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payout admins can manage payouts"
ON public.affiliate_payouts FOR ALL TO authenticated
USING (public.can_manage_payouts())
WITH CHECK (public.can_manage_payouts());

CREATE POLICY "Referrers can view their own payouts"
ON public.affiliate_payouts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = affiliate_payouts.affiliate_id AND a.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.discount_codes d
    WHERE d.id = affiliate_payouts.discount_code_id AND d.owner_user_id = auth.uid()
  )
);

CREATE TRIGGER trg_affiliate_payouts_updated
BEFORE UPDATE ON public.affiliate_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();