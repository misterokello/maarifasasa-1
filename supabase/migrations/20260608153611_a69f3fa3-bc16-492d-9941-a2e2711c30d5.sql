
CREATE TABLE IF NOT EXISTS public.admin_export_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  export_type text NOT NULL,
  filename text,
  row_count integer,
  range_from timestamptz,
  range_to timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_export_log_user_id ON public.admin_export_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_export_log_created_at ON public.admin_export_log(created_at DESC);

GRANT SELECT, INSERT ON public.admin_export_log TO authenticated;
GRANT ALL ON public.admin_export_log TO service_role;

ALTER TABLE public.admin_export_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view export log"
ON public.admin_export_log
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert their own export log"
ON public.admin_export_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND user_id = auth.uid());
