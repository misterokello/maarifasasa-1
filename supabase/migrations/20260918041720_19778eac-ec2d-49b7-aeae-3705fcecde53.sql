
-- 1. site_settings: restrict public reads to known non-sensitive keys
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read display settings" ON public.site_settings;
CREATE POLICY "Public can read display settings"
ON public.site_settings
FOR SELECT
USING (setting_key IN ('homepage_hero'));

-- 2. discount_code_redemptions: remove owner row-level access to full records
DROP POLICY IF EXISTS "Owners can view their redemptions" ON public.discount_code_redemptions;

CREATE OR REPLACE FUNCTION public.my_referral_redemptions()
RETURNS TABLE(
  id uuid,
  discount_code_id uuid,
  created_at timestamptz,
  user_id uuid,
  payer_email_masked text,
  currency text,
  commission_amount numeric,
  commission_status text,
  commission_paid_at timestamptz,
  product_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.discount_code_id,
    r.created_at,
    r.user_id,
    CASE
      WHEN r.payer_email IS NULL OR position('@' in r.payer_email) = 0 THEN NULL
      ELSE left(split_part(r.payer_email, '@', 1), 1) || '***@' || split_part(r.payer_email, '@', 2)
    END AS payer_email_masked,
    r.currency,
    r.commission_amount,
    r.commission_status,
    r.commission_paid_at,
    p.name AS product_name
  FROM public.discount_code_redemptions r
  JOIN public.discount_codes c ON c.id = r.discount_code_id
  LEFT JOIN public.products p ON p.id = r.product_id
  WHERE c.owner_user_id = auth.uid()
  ORDER BY r.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.my_referral_redemptions() FROM anon;
GRANT EXECUTE ON FUNCTION public.my_referral_redemptions() TO authenticated;
