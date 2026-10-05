CREATE TABLE public.popup_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES public.popups(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'dismissal', 'cta_click')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert popup analytics"
  ON public.popup_analytics FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view popup analytics"
  ON public.popup_analytics FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_popup_analytics_popup_id ON public.popup_analytics(popup_id);
CREATE INDEX idx_popup_analytics_created_at ON public.popup_analytics(created_at);