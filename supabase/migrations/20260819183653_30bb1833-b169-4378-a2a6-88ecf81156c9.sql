REVOKE ALL ON FUNCTION public.log_recruitment_event() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.log_application_score() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_application_stage() FROM anon, authenticated;