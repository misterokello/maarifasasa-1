
-- helper: can manage hiring (admin or hr_admin)
CREATE OR REPLACE FUNCTION public.can_manage_hiring()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::app_role, 'hr_admin'::app_role)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_hiring() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_hiring() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- job_postings
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  department text,
  location text,
  employment_type text NOT NULL DEFAULT 'permanent',
  reports_to text,
  salary_band text,
  salary_visible boolean NOT NULL DEFAULT false,
  contract_duration_months int,
  safeguarding_level text NOT NULL DEFAULT 'none',
  application_mode text NOT NULL DEFAULT 'internal_form',
  external_apply_url text,
  summary text,
  description text,
  responsibilities text,
  essential_criteria text,
  desirable_criteria text,
  status text NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  closes_at timestamptz,
  internal_only boolean NOT NULL DEFAULT false,
  encourage_diversity_statement boolean NOT NULL DEFAULT true,
  featured_image_url text,
  views int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published postings" ON public.job_postings FOR SELECT TO anon, authenticated
USING (status = 'published' AND internal_only = false AND (closes_at IS NULL OR closes_at > now()));
CREATE POLICY "Authenticated can view internal postings" ON public.job_postings FOR SELECT TO authenticated
USING (status = 'published' AND internal_only = true);
CREATE POLICY "HR can manage postings" ON public.job_postings FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_job_postings_updated BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_job_postings_status ON public.job_postings(status);

-- recruitment_requests
CREATE TABLE public.recruitment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text,
  reports_to text,
  justification text NOT NULL,
  is_replacement boolean NOT NULL DEFAULT false,
  budget_line text,
  funding_source text,
  proposed_grade text,
  proposed_salary_band text,
  required_start_date date,
  approver_role text NOT NULL DEFAULT 'hr_lead',
  status text NOT NULL DEFAULT 'pending',
  decision_notes text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruitment_requests TO authenticated;
GRANT ALL ON public.recruitment_requests TO service_role;
ALTER TABLE public.recruitment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage requests" ON public.recruitment_requests FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_recruitment_requests_updated BEFORE UPDATE ON public.recruitment_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- job_applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  cover_letter text,
  resume_path text,
  portfolio_url text,
  source text DEFAULT 'website',
  status text NOT NULL DEFAULT 'new',
  status_notes text,
  rejection_reason text,
  withdrawal_reason text,
  consent_data_retention boolean NOT NULL DEFAULT false,
  retain_for_future boolean NOT NULL DEFAULT false,
  diversity_self_id jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT INSERT ON public.job_applications TO anon, authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply to a published role" ON public.job_applications FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.job_postings p
    WHERE p.id = job_posting_id
      AND p.status = 'published'
      AND p.application_mode = 'internal_form'
      AND (p.closes_at IS NULL OR p.closes_at > now())
  )
  AND consent_data_retention = true
);
CREATE POLICY "HR can manage applications" ON public.job_applications FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_job_applications_updated BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_job_applications_job ON public.job_applications(job_posting_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- interview_panels & members
CREATE TABLE public.interview_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_panels TO authenticated;
GRANT ALL ON public.interview_panels TO service_role;
ALTER TABLE public.interview_panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage panels" ON public.interview_panels FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_panels_updated BEFORE UPDATE ON public.interview_panels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.interview_panel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id uuid NOT NULL REFERENCES public.interview_panels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'internal',
  is_external boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_panel_members TO authenticated;
GRANT ALL ON public.interview_panel_members TO service_role;
ALTER TABLE public.interview_panel_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage panel members" ON public.interview_panel_members FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());

-- interview_sessions
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  panel_id uuid REFERENCES public.interview_panels(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'interview',
  scheduled_at timestamptz,
  duration_minutes int DEFAULT 60,
  format text DEFAULT 'video',
  location_or_url text,
  status text NOT NULL DEFAULT 'scheduled',
  recommendation text,
  summary text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage sessions" ON public.interview_sessions FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- application_scores
CREATE TABLE public.application_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'shortlist',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  criterion text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  score numeric NOT NULL,
  max_score numeric NOT NULL DEFAULT 5,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_scores TO authenticated;
GRANT ALL ON public.application_scores TO service_role;
ALTER TABLE public.application_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage scores" ON public.application_scores FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());

-- reference_checks
CREATE TABLE public.reference_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  type text NOT NULL,
  referee_name text,
  referee_role text,
  referee_email text,
  referee_phone text,
  status text NOT NULL DEFAULT 'pending',
  evidence_path text,
  notes text,
  requested_at timestamptz,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reference_checks TO authenticated;
GRANT ALL ON public.reference_checks TO service_role;
ALTER TABLE public.reference_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage checks" ON public.reference_checks FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_checks_updated BEFORE UPDATE ON public.reference_checks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- offer_letters
CREATE TABLE public.offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  job_title text NOT NULL,
  salary text,
  benefits text,
  start_date date,
  probation_months int NOT NULL DEFAULT 6,
  contract_type text,
  reports_to text,
  conditions text,
  content text,
  signed_file_path text,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  declined_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;
GRANT ALL ON public.offer_letters TO service_role;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage offers" ON public.offer_letters FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offer_letters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- recruitment_audit_log
CREATE TABLE public.recruitment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.recruitment_audit_log TO authenticated;
GRANT ALL ON public.recruitment_audit_log TO service_role;
ALTER TABLE public.recruitment_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can read audit" ON public.recruitment_audit_log FOR SELECT TO authenticated
USING (public.can_manage_hiring());
CREATE POLICY "HR can append audit" ON public.recruitment_audit_log FOR INSERT TO authenticated
WITH CHECK (public.can_manage_hiring());
CREATE INDEX idx_audit_entity ON public.recruitment_audit_log(entity_type, entity_id);

-- templates
CREATE TABLE public.jd_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jd_templates TO authenticated;
GRANT ALL ON public.jd_templates TO service_role;
ALTER TABLE public.jd_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage jd templates" ON public.jd_templates FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_jd_tpl_updated BEFORE UPDATE ON public.jd_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.scoring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'interview',
  criteria jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoring_templates TO authenticated;
GRANT ALL ON public.scoring_templates TO service_role;
ALTER TABLE public.scoring_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR can manage scoring templates" ON public.scoring_templates FOR ALL TO authenticated
USING (public.can_manage_hiring()) WITH CHECK (public.can_manage_hiring());
CREATE TRIGGER trg_score_tpl_updated BEFORE UPDATE ON public.scoring_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
