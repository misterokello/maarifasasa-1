
CREATE OR REPLACE FUNCTION public.increment_affiliate_earnings(affiliate_id_param uuid, amount_param numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET total_earnings = total_earnings + amount_param
  WHERE id = affiliate_id_param;
END;
$$;
