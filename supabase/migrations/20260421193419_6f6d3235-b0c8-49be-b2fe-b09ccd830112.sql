
-- Advisor assessments table
CREATE TABLE public.advisor_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code text NOT NULL UNIQUE,
  user_id uuid NULL,
  email text NULL,
  full_name text NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendation jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX advisor_assessments_share_code_idx ON public.advisor_assessments(share_code);
CREATE INDEX advisor_assessments_user_id_idx ON public.advisor_assessments(user_id);
CREATE INDEX advisor_assessments_created_at_idx ON public.advisor_assessments(created_at DESC);

ALTER TABLE public.advisor_assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can create an assessment
CREATE POLICY "Anyone can create assessments"
  ON public.advisor_assessments FOR INSERT
  WITH CHECK (true);

-- Anyone can read assessments (public share by share_code; the code is a non-guessable secret).
-- App code filters by share_code; this enables guest sharing without auth.
CREATE POLICY "Anyone can view assessments"
  ON public.advisor_assessments FOR SELECT
  USING (true);

-- Signed-in users can update their own
CREATE POLICY "Users can update own assessments"
  ON public.advisor_assessments FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admins manage all
CREATE POLICY "Admins manage all assessments"
  ON public.advisor_assessments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated-at trigger
CREATE TRIGGER advisor_assessments_updated_at
  BEFORE UPDATE ON public.advisor_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
