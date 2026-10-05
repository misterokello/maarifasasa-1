-- Restrict Thinkific sync queue writes to admins only.
-- SELECT policy already exists (admin or learner_admin). Add admin-only UPDATE
-- so retry/cancel actions from /admin-learners work and are locked down.
CREATE POLICY "Admins update sync queue"
  ON public.thinkific_sync_queue
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete sync queue"
  ON public.thinkific_sync_queue
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));