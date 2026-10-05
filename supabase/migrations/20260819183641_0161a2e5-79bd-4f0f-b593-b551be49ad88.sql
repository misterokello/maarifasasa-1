-- 1) Generic recruitment audit logging for every hiring entity
CREATE OR REPLACE FUNCTION public.log_recruitment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ent text := TG_ARGV[0];
  uid uuid := auth.uid();
  who text;
  act text;
  eid uuid;
  body jsonb := '{}'::jsonb;
  old_status text;
  new_status text;
BEGIN
  IF uid IS NOT NULL THEN
    SELECT u.email INTO who FROM auth.users u WHERE u.id = uid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    eid := NEW.id;
    act := 'created';
    BEGIN new_status := to_jsonb(NEW)->>'status'; EXCEPTION WHEN others THEN new_status := NULL; END;
    body := jsonb_strip_nulls(jsonb_build_object('status', new_status));
  ELSIF TG_OP = 'DELETE' THEN
    eid := OLD.id;
    act := 'deleted';
    body := jsonb_strip_nulls(jsonb_build_object('status', to_jsonb(OLD)->>'status'));
  ELSE
    eid := NEW.id;
    old_status := to_jsonb(OLD)->>'status';
    new_status := to_jsonb(NEW)->>'status';
    IF new_status IS DISTINCT FROM old_status THEN
      act := 'status:' || COALESCE(new_status, 'null');
      body := jsonb_build_object('from', old_status, 'to', new_status);
    ELSE
      act := 'updated';
      body := jsonb_strip_nulls(jsonb_build_object('status', new_status));
    END IF;
  END IF;

  INSERT INTO public.recruitment_audit_log (entity_type, entity_id, action, actor_id, actor_label, payload)
  VALUES (ent, eid, act, uid, who, body);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_recruitment_requests ON public.recruitment_requests;
CREATE TRIGGER trg_audit_recruitment_requests
AFTER INSERT OR UPDATE OR DELETE ON public.recruitment_requests
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('recruitment_request');

DROP TRIGGER IF EXISTS trg_audit_job_postings ON public.job_postings;
CREATE TRIGGER trg_audit_job_postings
AFTER INSERT OR UPDATE OR DELETE ON public.job_postings
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('job_posting');

DROP TRIGGER IF EXISTS trg_audit_job_applications ON public.job_applications;
CREATE TRIGGER trg_audit_job_applications
AFTER INSERT OR UPDATE OR DELETE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('job_application');

DROP TRIGGER IF EXISTS trg_audit_interview_sessions ON public.interview_sessions;
CREATE TRIGGER trg_audit_interview_sessions
AFTER INSERT OR UPDATE OR DELETE ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('interview_session');

DROP TRIGGER IF EXISTS trg_audit_reference_checks ON public.reference_checks;
CREATE TRIGGER trg_audit_reference_checks
AFTER INSERT OR UPDATE OR DELETE ON public.reference_checks
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('reference_check');

DROP TRIGGER IF EXISTS trg_audit_offer_letters ON public.offer_letters;
CREATE TRIGGER trg_audit_offer_letters
AFTER INSERT OR UPDATE OR DELETE ON public.offer_letters
FOR EACH ROW EXECUTE FUNCTION public.log_recruitment_event('offer_letter');

-- Scores get their own log entry with the criterion + value
CREATE OR REPLACE FUNCTION public.log_application_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  who text;
BEGIN
  IF uid IS NOT NULL THEN
    SELECT u.email INTO who FROM auth.users u WHERE u.id = uid;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.recruitment_audit_log (entity_type, entity_id, action, actor_id, actor_label, payload)
    VALUES ('application_score', OLD.application_id, 'review_removed', uid, who,
            jsonb_build_object('criterion', OLD.criterion, 'stage', OLD.stage));
    RETURN OLD;
  END IF;

  INSERT INTO public.recruitment_audit_log (entity_type, entity_id, action, actor_id, actor_label, payload)
  VALUES ('application_score', NEW.application_id,
          CASE WHEN TG_OP = 'INSERT' THEN 'review_added' ELSE 'review_updated' END,
          uid, who,
          jsonb_build_object('criterion', NEW.criterion, 'stage', NEW.stage,
                             'score', NEW.score, 'max_score', NEW.max_score, 'weight', NEW.weight));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_application_scores ON public.application_scores;
CREATE TRIGGER trg_audit_application_scores
AFTER INSERT OR UPDATE OR DELETE ON public.application_scores
FOR EACH ROW EXECUTE FUNCTION public.log_application_score();

-- 2) Keep the pipeline in sync across stages
CREATE OR REPLACE FUNCTION public.sync_application_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target text;
BEGIN
  IF TG_TABLE_NAME = 'offer_letters' THEN
    target := CASE NEW.status
      WHEN 'sent' THEN 'offer'
      WHEN 'approved' THEN 'offer'
      WHEN 'accepted' THEN 'hired'
      WHEN 'declined' THEN 'rejected'
      ELSE NULL END;
  ELSIF TG_TABLE_NAME = 'interview_sessions' THEN
    target := CASE WHEN NEW.status = 'scheduled' THEN 'interview' ELSE NULL END;
  ELSIF TG_TABLE_NAME = 'reference_checks' THEN
    target := CASE WHEN NEW.status IN ('requested', 'in_progress') THEN 'reference_check' ELSE NULL END;
  END IF;

  IF target IS NULL THEN RETURN NEW; END IF;

  UPDATE public.job_applications
  SET status = target
  WHERE id = NEW.application_id
    AND status <> target
    AND status NOT IN ('hired', 'rejected', 'withdrawn');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stage_offers ON public.offer_letters;
CREATE TRIGGER trg_sync_stage_offers
AFTER INSERT OR UPDATE OF status ON public.offer_letters
FOR EACH ROW EXECUTE FUNCTION public.sync_application_stage();

DROP TRIGGER IF EXISTS trg_sync_stage_interviews ON public.interview_sessions;
CREATE TRIGGER trg_sync_stage_interviews
AFTER INSERT OR UPDATE OF status ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION public.sync_application_stage();

DROP TRIGGER IF EXISTS trg_sync_stage_checks ON public.reference_checks;
CREATE TRIGGER trg_sync_stage_checks
AFTER INSERT OR UPDATE OF status ON public.reference_checks
FOR EACH ROW EXECUTE FUNCTION public.sync_application_stage();

-- 3) Standardised review criteria (1-5 scale) seeded once
INSERT INTO public.scoring_templates (name, stage, criteria)
SELECT v.name, v.stage, v.criteria::jsonb
FROM (VALUES
  ('Standard shortlisting', 'shortlist', '[{"criterion":"Essential criteria met","weight":3},{"criterion":"Relevant experience","weight":2},{"criterion":"Qualifications","weight":1},{"criterion":"Motivation / fit","weight":1}]'),
  ('Standard interview', 'interview', '[{"criterion":"Technical / role knowledge","weight":3},{"criterion":"Communication","weight":2},{"criterion":"Problem solving","weight":2},{"criterion":"Values & safeguarding","weight":2},{"criterion":"Teamwork","weight":1}]'),
  ('Standard assessment', 'assessment', '[{"criterion":"Task accuracy","weight":3},{"criterion":"Quality of output","weight":2},{"criterion":"Timeliness","weight":1}]'),
  ('Standard final panel', 'final', '[{"criterion":"Overall suitability","weight":3},{"criterion":"Leadership potential","weight":2},{"criterion":"Salary / start-date fit","weight":1}]')
) AS v(name, stage, criteria)
WHERE NOT EXISTS (SELECT 1 FROM public.scoring_templates st WHERE st.name = v.name);