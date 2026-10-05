CREATE OR REPLACE FUNCTION public.claim_my_partner_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  em text;
  n integer := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT lower(trim(u.email)) INTO em FROM auth.users u WHERE u.id = uid;
  IF em IS NULL OR em = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.discount_codes dc
  SET owner_user_id = uid,
      portal_activated_at = COALESCE(dc.portal_activated_at, now())
  WHERE dc.owner_user_id IS NULL
    AND lower(trim(dc.owner_email)) = em;

  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.discount_codes dc
  SET portal_activated_at = now()
  WHERE dc.owner_user_id = uid
    AND dc.portal_activated_at IS NULL;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_my_partner_codes() TO authenticated;