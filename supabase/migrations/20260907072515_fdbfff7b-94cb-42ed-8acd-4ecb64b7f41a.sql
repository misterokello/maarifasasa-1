CREATE OR REPLACE FUNCTION public.job_posting_public_salary_band(_posting_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN jp.salary_visible THEN jp.salary_band ELSE NULL END
  FROM public.job_postings jp
  WHERE jp.id = _posting_id
    AND jp.status = 'published'
    AND jp.internal_only = false
$$;

GRANT EXECUTE ON FUNCTION public.job_posting_public_salary_band(uuid) TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.public_job_postings;

CREATE VIEW public.public_job_postings
WITH (security_invoker = true) AS
SELECT
  id, slug, title, department, location, employment_type, reports_to,
  public.job_posting_public_salary_band(id) AS salary_band,
  salary_visible, contract_duration_months, safeguarding_level, application_mode,
  external_apply_url, summary, description, responsibilities, essential_criteria,
  desirable_criteria, status, posted_at, closes_at, internal_only,
  encourage_diversity_statement, featured_image_url, views, created_at, updated_at,
  jd_pdf_path, jd_pdf_name
FROM public.job_postings;

GRANT SELECT ON public.public_job_postings TO anon, authenticated;