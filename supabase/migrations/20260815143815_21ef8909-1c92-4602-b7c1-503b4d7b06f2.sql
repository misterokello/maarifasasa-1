ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS jd_pdf_path text,
  ADD COLUMN IF NOT EXISTS jd_pdf_name text;