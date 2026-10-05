DROP POLICY IF EXISTS "Authenticated can view internal postings" ON public.job_postings;
CREATE POLICY "Staff can view internal postings"
ON public.job_postings
FOR SELECT
TO authenticated
USING (status = 'published' AND internal_only = true AND public.can_manage_hiring());