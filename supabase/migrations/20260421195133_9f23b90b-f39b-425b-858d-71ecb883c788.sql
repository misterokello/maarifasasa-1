
CREATE TABLE public.mentor_call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.advisor_assessments(id) ON DELETE SET NULL,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text NOT NULL DEFAULT 'Africa/Kampala',
  topic text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_call_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a mentor call"
  ON public.mentor_call_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage mentor calls"
  ON public.mentor_call_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view their own mentor calls"
  ON public.mentor_call_requests FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE TRIGGER update_mentor_call_requests_updated_at
  BEFORE UPDATE ON public.mentor_call_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_mentor_call_requests_date ON public.mentor_call_requests(preferred_date, preferred_time);
