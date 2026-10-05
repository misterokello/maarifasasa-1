CREATE TABLE public.media_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  article_url text NOT NULL,
  outlet_name text,
  outlet_logo_url text,
  image_url text,
  excerpt text,
  published_at date,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.media_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_features TO authenticated;
GRANT ALL ON public.media_features TO service_role;

ALTER TABLE public.media_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active media features"
ON public.media_features FOR SELECT
USING (is_active = true OR public.can_manage_blog());

CREATE POLICY "Content admins can insert media features"
ON public.media_features FOR INSERT TO authenticated
WITH CHECK (public.can_manage_blog());

CREATE POLICY "Content admins can update media features"
ON public.media_features FOR UPDATE TO authenticated
USING (public.can_manage_blog()) WITH CHECK (public.can_manage_blog());

CREATE POLICY "Content admins can delete media features"
ON public.media_features FOR DELETE TO authenticated
USING (public.can_manage_blog());

CREATE TRIGGER update_media_features_updated_at
BEFORE UPDATE ON public.media_features
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_media_features_active_sort ON public.media_features (is_active, sort_order, published_at DESC);