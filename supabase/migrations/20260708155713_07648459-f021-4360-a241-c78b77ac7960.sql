
CREATE POLICY "Learners read own CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'learner-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Learners upload own CVs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'learner-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Learners update own CVs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'learner-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Learners delete own CVs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'learner-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all CVs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'learner-cvs' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin')));
