DROP POLICY IF EXISTS "Anyone can apply" ON public.discount_code_applications;

CREATE POLICY "Anyone can apply"
ON public.discount_code_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND discount_code_id IS NULL
  AND decline_reason IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
);

-- Column-level insert privileges: applicants may only supply their own details.
REVOKE INSERT ON public.discount_code_applications FROM anon, authenticated;

GRANT INSERT (full_name, email, phone, channel, audience_size, social_links, motivation, requested_code, status)
ON public.discount_code_applications TO anon, authenticated;