
CREATE OR REPLACE FUNCTION public.set_audit_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  email text;
BEGIN
  IF NEW.actor_id IS NULL AND uid IS NOT NULL THEN
    NEW.actor_id := uid;
  END IF;
  IF NEW.actor_label IS NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT u.email INTO email FROM auth.users u WHERE u.id = NEW.actor_id;
    NEW.actor_label := email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_audit_actor ON public.recruitment_audit_log;
CREATE TRIGGER trg_set_audit_actor
BEFORE INSERT ON public.recruitment_audit_log
FOR EACH ROW EXECUTE FUNCTION public.set_audit_actor();
