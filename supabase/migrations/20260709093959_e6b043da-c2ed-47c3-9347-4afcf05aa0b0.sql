
-- Enable extensions needed for the scheduled worker drain
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Backfill profiles.thinkific_user_id from historical payment metadata.
-- Use the most recent successful payment per email that carries a Thinkific user id.
WITH latest_tk AS (
  SELECT DISTINCT ON (lower(payer_email))
    lower(payer_email)                                   AS email,
    NULLIF(metadata->>'thinkific_user_id','')::bigint    AS tk_user_id,
    completed_at
  FROM public.payments
  WHERE status = 'success'
    AND payer_email IS NOT NULL
    AND metadata ? 'thinkific_user_id'
    AND NULLIF(metadata->>'thinkific_user_id','') ~ '^[0-9]+$'
  ORDER BY lower(payer_email), completed_at DESC NULLS LAST
)
UPDATE public.profiles p
SET thinkific_user_id = latest_tk.tk_user_id,
    thinkific_synced_at = COALESCE(p.thinkific_synced_at, latest_tk.completed_at, now())
FROM latest_tk
WHERE lower(p.email) = latest_tk.email
  AND p.thinkific_user_id IS NULL
  AND latest_tk.tk_user_id IS NOT NULL;

-- Backfill enrollments for historical successful payments that mapped to a
-- Thinkific-course product and a known local profile.
INSERT INTO public.enrollments (
  user_id, product_id, thinkific_course_id, thinkific_enrollment_id,
  payment_id, status, activated_at, last_synced_at, metadata
)
SELECT DISTINCT ON (pr.id, prod.thinkific_course_id)
  pr.id,
  prod.id,
  prod.thinkific_course_id,
  CASE
    WHEN pay.metadata ? 'thinkific_enrollment_id'
     AND NULLIF(pay.metadata->>'thinkific_enrollment_id','') ~ '^[0-9]+$'
    THEN (pay.metadata->>'thinkific_enrollment_id')::bigint
    ELSE NULL
  END,
  pay.id,
  'active',
  COALESCE(pay.completed_at, pay.created_at),
  COALESCE(pay.completed_at, pay.created_at),
  jsonb_build_object('source','backfill','access_email_sent_at', COALESCE(pay.completed_at, pay.created_at))
FROM public.payments pay
JOIN public.products prod ON prod.id = pay.product_id
JOIN public.profiles pr   ON lower(pr.email) = lower(pay.payer_email)
WHERE pay.status = 'success'
  AND prod.thinkific_course_id IS NOT NULL
ORDER BY pr.id, prod.thinkific_course_id, pay.completed_at DESC NULLS LAST
ON CONFLICT (user_id, thinkific_course_id) DO NOTHING;
