-- Helper: who can manage the discount module
CREATE OR REPLACE FUNCTION public.can_manage_discounts()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'discount_admin'::app_role)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.can_manage_discounts() FROM anon;

-- ===========================================================
-- discount_codes
-- ===========================================================
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name text,
  owner_email text,
  percent_off numeric NOT NULL CHECK (percent_off > 0 AND percent_off <= 100),
  commission_percent numeric NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  max_redemptions integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  applies_to_all_products boolean NOT NULL DEFAULT false,
  notes text,
  clicks integer NOT NULL DEFAULT 0,
  signups_count integer NOT NULL DEFAULT 0,
  redemptions_count integer NOT NULL DEFAULT 0,
  total_commission numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_discount_codes_owner ON public.discount_codes(owner_user_id);
CREATE INDEX idx_discount_codes_code_lower ON public.discount_codes(lower(code));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount managers can view codes" ON public.discount_codes
  FOR SELECT TO authenticated USING (public.can_manage_discounts());
CREATE POLICY "Owners can view their own code" ON public.discount_codes
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Discount managers can insert codes" ON public.discount_codes
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_discounts());
CREATE POLICY "Discount managers can update codes" ON public.discount_codes
  FOR UPDATE TO authenticated USING (public.can_manage_discounts()) WITH CHECK (public.can_manage_discounts());
CREATE POLICY "Discount managers can delete codes" ON public.discount_codes
  FOR DELETE TO authenticated USING (public.can_manage_discounts());

CREATE TRIGGER trg_discount_codes_updated
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================
-- discount_code_products
-- ===========================================================
CREATE TABLE public.discount_code_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (discount_code_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_code_products TO authenticated;
GRANT ALL ON public.discount_code_products TO service_role;
ALTER TABLE public.discount_code_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount managers manage code products" ON public.discount_code_products
  FOR ALL TO authenticated USING (public.can_manage_discounts()) WITH CHECK (public.can_manage_discounts());
CREATE POLICY "Owners can view their code products" ON public.discount_code_products
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.discount_codes c WHERE c.id = discount_code_id AND c.owner_user_id = auth.uid())
  );

-- ===========================================================
-- discount_code_applications
-- ===========================================================
CREATE TABLE public.discount_code_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  channel text,
  audience_size text,
  social_links text,
  motivation text,
  requested_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  decline_reason text,
  discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.discount_code_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_code_applications TO authenticated;
GRANT ALL ON public.discount_code_applications TO service_role;
ALTER TABLE public.discount_code_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.discount_code_applications
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND discount_code_id IS NULL);
CREATE POLICY "Discount managers can view applications" ON public.discount_code_applications
  FOR SELECT TO authenticated USING (public.can_manage_discounts());
CREATE POLICY "Discount managers can update applications" ON public.discount_code_applications
  FOR UPDATE TO authenticated USING (public.can_manage_discounts()) WITH CHECK (public.can_manage_discounts());
CREATE POLICY "Discount managers can delete applications" ON public.discount_code_applications
  FOR DELETE TO authenticated USING (public.can_manage_discounts());

CREATE TRIGGER trg_discount_applications_updated
  BEFORE UPDATE ON public.discount_code_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================
-- discount_code_clicks
-- ===========================================================
CREATE TABLE public.discount_code_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  referrer text,
  landing_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_discount_clicks_code ON public.discount_code_clicks(discount_code_id, created_at DESC);
GRANT SELECT ON public.discount_code_clicks TO authenticated;
GRANT ALL ON public.discount_code_clicks TO service_role;
ALTER TABLE public.discount_code_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount managers can view clicks" ON public.discount_code_clicks
  FOR SELECT TO authenticated USING (public.can_manage_discounts());
CREATE POLICY "Owners can view their clicks" ON public.discount_code_clicks
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.discount_codes c WHERE c.id = discount_code_id AND c.owner_user_id = auth.uid())
  );

-- ===========================================================
-- discount_code_signups
-- ===========================================================
CREATE TABLE public.discount_code_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (discount_code_id, user_id)
);
CREATE INDEX idx_discount_signups_code ON public.discount_code_signups(discount_code_id, created_at DESC);
GRANT SELECT ON public.discount_code_signups TO authenticated;
GRANT ALL ON public.discount_code_signups TO service_role;
ALTER TABLE public.discount_code_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount managers can view signups" ON public.discount_code_signups
  FOR SELECT TO authenticated USING (public.can_manage_discounts());
CREATE POLICY "Owners can view their signups" ON public.discount_code_signups
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.discount_codes c WHERE c.id = discount_code_id AND c.owner_user_id = auth.uid())
  );

-- ===========================================================
-- discount_code_redemptions
-- ===========================================================
CREATE TABLE public.discount_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  user_id uuid,
  payer_email text,
  currency text NOT NULL DEFAULT 'UGX',
  original_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  charged_amount numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id)
);
CREATE INDEX idx_discount_redemptions_code ON public.discount_code_redemptions(discount_code_id, created_at DESC);
GRANT SELECT ON public.discount_code_redemptions TO authenticated;
GRANT ALL ON public.discount_code_redemptions TO service_role;
ALTER TABLE public.discount_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discount managers can view redemptions" ON public.discount_code_redemptions
  FOR SELECT TO authenticated USING (public.can_manage_discounts());
CREATE POLICY "Owners can view their redemptions" ON public.discount_code_redemptions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.discount_codes c WHERE c.id = discount_code_id AND c.owner_user_id = auth.uid())
  );

CREATE TRIGGER trg_discount_redemptions_updated
  BEFORE UPDATE ON public.discount_code_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================
-- Public-safe resolver: code + optional product -> discount info
-- ===========================================================
CREATE OR REPLACE FUNCTION public.resolve_discount_code(_code text, _product_slug text DEFAULT NULL)
RETURNS TABLE(
  valid boolean,
  reason text,
  code text,
  label text,
  percent_off numeric,
  applies_to_product boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.discount_codes;
  prod public.products;
  scoped boolean := false;
BEGIN
  SELECT * INTO c FROM public.discount_codes dc WHERE lower(dc.code) = lower(trim(_code)) LIMIT 1;

  IF c.id IS NULL THEN
    RETURN QUERY SELECT false, 'not_found', NULL::text, NULL::text, NULL::numeric, false; RETURN;
  END IF;
  IF NOT c.is_active THEN
    RETURN QUERY SELECT false, 'inactive', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN
    RETURN QUERY SELECT false, 'not_started', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;
  IF c.ends_at IS NOT NULL AND now() > c.ends_at THEN
    RETURN QUERY SELECT false, 'expired', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;
  IF c.max_redemptions IS NOT NULL AND c.redemptions_count >= c.max_redemptions THEN
    RETURN QUERY SELECT false, 'limit_reached', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;

  IF _product_slug IS NULL THEN
    RETURN QUERY SELECT true, NULL::text, c.code, c.label, c.percent_off, false; RETURN;
  END IF;

  SELECT * INTO prod FROM public.products p WHERE p.slug = _product_slug AND p.is_active = true LIMIT 1;
  IF prod.id IS NULL THEN
    RETURN QUERY SELECT false, 'product_not_found', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;

  IF c.applies_to_all_products THEN
    scoped := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.discount_code_products dp
      WHERE dp.discount_code_id = c.id AND dp.product_id = prod.id
    ) INTO scoped;
  END IF;

  IF NOT scoped THEN
    RETURN QUERY SELECT false, 'not_applicable', c.code, c.label, NULL::numeric, false; RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text, c.code, c.label, c.percent_off, true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_discount_code(text, text) TO anon, authenticated, service_role;