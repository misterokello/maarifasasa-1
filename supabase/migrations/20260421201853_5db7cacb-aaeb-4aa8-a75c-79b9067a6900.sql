-- Admin Google OAuth tokens for Calendar/Meet integration
CREATE TABLE public.admin_google_tokens (
  user_id uuid PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry timestamptz NOT NULL,
  scope text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_google_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage tokens; users only see their own row
CREATE POLICY "Admins manage all google tokens"
  ON public.admin_google_tokens
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read own google token"
  ON public.admin_google_tokens
  FOR SELECT
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_admin_google_tokens_updated_at
  BEFORE UPDATE ON public.admin_google_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add Google Meet metadata to mentor_call_requests
ALTER TABLE public.mentor_call_requests
  ADD COLUMN IF NOT EXISTS meet_link text,
  ADD COLUMN IF NOT EXISTS calendar_event_id text,
  ADD COLUMN IF NOT EXISTS scheduled_by uuid,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Allow admins (in addition to self) to UPDATE mentor calls (status, meet link, notes)
-- The existing "Admins manage mentor calls" ALL policy already covers this.

-- Advisor analytics events: track every interaction in the advisor funnel
CREATE TABLE public.advisor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  -- e.g. hero_view, wizard_start, wizard_step, wizard_complete,
  -- recommendation_viewed, alternative_clicked, enroll_clicked,
  -- pdf_downloaded, save_clicked, share_copied, mentor_call_requested,
  -- chat_message_sent, chat_message_received
  assessment_id uuid,
  user_id uuid,
  session_id text,
  product_slug text,
  step_index integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisor_events_created_at ON public.advisor_events (created_at DESC);
CREATE INDEX idx_advisor_events_type ON public.advisor_events (event_type);
CREATE INDEX idx_advisor_events_assessment ON public.advisor_events (assessment_id);
CREATE INDEX idx_advisor_events_session ON public.advisor_events (session_id);

ALTER TABLE public.advisor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert advisor events"
  ON public.advisor_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view advisor events"
  ON public.advisor_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));