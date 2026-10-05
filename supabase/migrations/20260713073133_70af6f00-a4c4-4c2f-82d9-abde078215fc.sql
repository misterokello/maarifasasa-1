GRANT SELECT ON public.profile_field_definitions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_field_definitions TO authenticated;
GRANT ALL ON public.profile_field_definitions TO service_role;