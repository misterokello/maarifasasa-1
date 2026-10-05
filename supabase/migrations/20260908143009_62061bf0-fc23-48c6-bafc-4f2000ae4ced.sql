REVOKE EXECUTE ON FUNCTION public.partner_group_roster(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_group_roster(text) TO authenticated, service_role;