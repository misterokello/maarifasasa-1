DROP POLICY IF EXISTS "Public can upload application resumes" ON storage.objects;

CREATE POLICY "Public can upload application resumes"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'recruitment'
  AND (storage.foldername(name))[1] = 'applications'
  AND array_length(storage.foldername(name), 1) = 2
  AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.job_postings jp
    WHERE jp.id = ((storage.foldername(name))[2])::uuid
      AND jp.status = 'published'
      AND jp.internal_only = false
  )
  AND storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx|rtf|odt|txt)$'
);