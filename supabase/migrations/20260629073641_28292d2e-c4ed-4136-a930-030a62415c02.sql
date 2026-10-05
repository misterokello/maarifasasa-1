
-- Allow anyone to upload a resume to the public-applications subfolder
CREATE POLICY "Public can upload application resumes" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'recruitment'
  AND (storage.foldername(name))[1] = 'applications'
);

CREATE POLICY "HR can read recruitment files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'recruitment' AND public.can_manage_hiring());

CREATE POLICY "HR can manage recruitment files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'recruitment' AND public.can_manage_hiring())
WITH CHECK (bucket_id = 'recruitment' AND public.can_manage_hiring());

CREATE POLICY "HR can delete recruitment files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'recruitment' AND public.can_manage_hiring());

CREATE POLICY "HR can upload recruitment files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recruitment' AND public.can_manage_hiring());
