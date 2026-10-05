-- Hide salary_band from direct API reads; expose it only through controlled paths.

REVOKE SELECT ON public.job_postings FROM anon, authenticated;

GRANT SELECT (id, slug, title, department, location, employment_type, reports_to, salary_visible,
  contract_duration_months, safeguarding_level, application_mode, external_apply_url, summary,
  description, responsibilities, essential_criteria, desirable_criteria, status, posted_at,
  closes_at, internal_only, encourage_diversity_statement, featured_image_url, views, created_by,
  approved_by, approved_at, created_at, updated_at, jd_pdf_path, jd_pdf_name)
ON public.job_postings TO anon, authenticated;

-- Public-facing view: salary band only when the posting says it is visible.
CREATE OR REPLACE VIEW public.public_job_postings
WITH (security_invoker = true) AS
SELECT
  id, slug, title, department, location, employment_type, reports_to,
  CASE WHEN salary_visible THEN salary_band ELSE NULL END AS salary_band,
  salary_visible, contract_duration_months, safeguarding_level, application_mode,
  external_apply_url, summary, description, responsibilities, essential_criteria,
  desirable_criteria, status, posted_at, closes_at, internal_only,
  encourage_diversity_statement, featured_image_url, views, created_at, updated_at,
  jd_pdf_path, jd_pdf_name
FROM public.job_postings;

GRANT SELECT ON public.public_job_postings TO anon, authenticated;

-- HR-only view returning the full row (including hidden salary bands).
CREATE OR REPLACE FUNCTION public.hr_job_postings()
RETURNS SETOF public.job_postings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.job_postings
  WHERE public.can_manage_hiring()
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.hr_job_postings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_job_postings() TO authenticated, service_role;