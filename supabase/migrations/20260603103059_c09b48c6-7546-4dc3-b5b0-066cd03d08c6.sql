
-- 1) advisor_assessments: lock down SELECT, add secure share_code lookup
DROP POLICY IF EXISTS "Anyone can view assessments" ON public.advisor_assessments;

CREATE POLICY "Owners and admins can view assessments"
ON public.advisor_assessments
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE FUNCTION public.get_assessment_by_share_code(_code text)
RETURNS TABLE (
  id uuid,
  answers jsonb,
  recommendation jsonb,
  full_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.answers, a.recommendation, a.full_name, a.email
  FROM public.advisor_assessments a
  WHERE a.share_code = _code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_assessment_by_share_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_assessment_by_share_code(text) TO anon, authenticated;

-- 2) blog_post_views: remove anyone-can-update / anyone-can-read
DROP POLICY IF EXISTS "Anyone can increment views" ON public.blog_post_views;
DROP POLICY IF EXISTS "Anyone can view view counts" ON public.blog_post_views;

-- Keep "Blog admins can view analytics" and "Anyone can track views" (insert) as-is.

-- 3) mentor_call_requests: remove anonymous INSERT; edge function uses service role
DROP POLICY IF EXISTS "Anyone can request a mentor call" ON public.mentor_call_requests;

-- 4) Storage: remove broad listing SELECT on public buckets
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
