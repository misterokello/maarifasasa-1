
-- Create popups table
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  popup_type text NOT NULL DEFAULT 'promotional' CHECK (popup_type IN ('promotional', 'banner')),
  -- Content fields
  heading text,
  body_text text,
  image_url text,
  button_text text,
  button_link text,
  -- Banner-specific
  banner_color text DEFAULT '#3b82f6',
  -- Display rules
  display_delay_seconds integer DEFAULT 0,
  show_once_per_session boolean DEFAULT true,
  -- Scheduling
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  -- Page targeting: null means all pages, otherwise array of route paths
  target_pages text[] DEFAULT NULL,
  -- Status
  is_active boolean DEFAULT false,
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Admins can manage all popups
CREATE POLICY "Admins can manage popups"
  ON public.popups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active popups (for rendering on public pages)
CREATE POLICY "Anyone can view active popups"
  ON public.popups FOR SELECT
  USING (is_active = true);
