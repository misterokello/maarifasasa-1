CREATE TABLE public.payout_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid,
  referrer_label text,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  amount numeric,
  currency text,
  actor_id uuid,
  actor_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payout_audit_log TO authenticated;
GRANT ALL ON public.payout_audit_log TO service_role;

ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payout managers can view audit log"
ON public.payout_audit_log FOR SELECT TO authenticated
USING (public.can_manage_payouts());

CREATE INDEX idx_payout_audit_log_payout ON public.payout_audit_log(payout_id);
CREATE INDEX idx_payout_audit_log_created ON public.payout_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.log_payout_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  who text;
BEGIN
  IF uid IS NOT NULL THEN
    SELECT u.email INTO who FROM auth.users u WHERE u.id = uid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
    VALUES (NEW.id, NEW.referrer_label, 'created', 'status', NULL, NEW.status, NEW.amount, NEW.currency, uid, who);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
    VALUES (OLD.id, OLD.referrer_label, 'deleted', 'status', OLD.status, NULL, OLD.amount, OLD.currency, uid, who);
    RETURN OLD;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
      VALUES (NEW.id, NEW.referrer_label, 'status_changed', 'status', OLD.status, NEW.status, NEW.amount, NEW.currency, uid, who);
    END IF;
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
      VALUES (NEW.id, NEW.referrer_label, 'amount_changed', 'amount', OLD.amount::text, NEW.amount::text, NEW.amount, NEW.currency, uid, who);
    END IF;
    IF NEW.method IS DISTINCT FROM OLD.method THEN
      INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
      VALUES (NEW.id, NEW.referrer_label, 'method_changed', 'method', OLD.method, NEW.method, NEW.amount, NEW.currency, uid, who);
    END IF;
    IF NEW.reference IS DISTINCT FROM OLD.reference THEN
      INSERT INTO public.payout_audit_log (payout_id, referrer_label, action, field, old_value, new_value, amount, currency, actor_id, actor_label)
      VALUES (NEW.id, NEW.referrer_label, 'reference_changed', 'reference', OLD.reference, NEW.reference, NEW.amount, NEW.currency, uid, who);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_log_payout_change
AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_payouts
FOR EACH ROW EXECUTE FUNCTION public.log_payout_change();