CREATE OR REPLACE VIEW public.public_job_postings
WITH (security_invoker = false) AS
SELECT
  id, slug, title, department, location, employment_type, reports_to,
  CASE WHEN salary_visible THEN salary_band ELSE NULL END AS salary_band,
  salary_visible, contract_duration_months, safeguarding_level, application_mode,
  external_apply_url, summary, description, responsibilities, essential_criteria,
  desirable_criteria, status, posted_at, closes_at, internal_only,
  encourage_diversity_statement, featured_image_url, views, created_at, updated_at,
  jd_pdf_path, jd_pdf_name
FROM public.job_postings
WHERE status = 'published'
  AND internal_only = false
  AND (closes_at IS NULL OR closes_at > now());

GRANT SELECT ON public.public_job_postings TO anon, authenticated;