
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS employment_status text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS years_experience text,
  ADD COLUMN IF NOT EXISTS highest_education text,
  ADD COLUMN IF NOT EXISTS cv_url text,
  ADD COLUMN IF NOT EXISTS career_interests text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS current_skill_level text,
  ADD COLUMN IF NOT EXISTS desired_career_path text,
  ADD COLUMN IF NOT EXISTS preferred_schedule text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS disability_status text,
  ADD COLUMN IF NOT EXISTS refugee_status text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS scholarship_program text,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS thinkific_user_id bigint,
  ADD COLUMN IF NOT EXISTS thinkific_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_thinkific_user_id_idx
  ON public.profiles (thinkific_user_id) WHERE thinkific_user_id IS NOT NULL;

-- 2. profile_field_definitions
CREATE TABLE IF NOT EXISTS public.profile_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  section text NOT NULL,
  input_type text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  placeholder text,
  help_text text,
  required boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_field_definitions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_field_definitions TO authenticated;
GRANT ALL ON public.profile_field_definitions TO service_role;
ALTER TABLE public.profile_field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visible profile fields"
  ON public.profile_field_definitions FOR SELECT
  USING (visible = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE POLICY "Admins manage profile fields"
  ON public.profile_field_definitions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE TRIGGER trg_profile_field_definitions_updated_at
  BEFORE UPDATE ON public.profile_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  thinkific_course_id text,
  thinkific_enrollment_id bigint,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_sync',
  activated_at timestamptz,
  completed_at timestamptz,
  progress_percent numeric(5,2) DEFAULT 0,
  last_synced_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, thinkific_course_id)
);
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON public.enrollments (user_id);
CREATE INDEX IF NOT EXISTS enrollments_status_idx ON public.enrollments (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners can read their own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE POLICY "Admins manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. thinkific_sync_queue
CREATE TABLE IF NOT EXISTS public.thinkific_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  related_enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  related_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thinkific_sync_queue_ready_idx
  ON public.thinkific_sync_queue (next_attempt_at) WHERE status = 'pending';
GRANT SELECT ON public.thinkific_sync_queue TO authenticated;
GRANT ALL ON public.thinkific_sync_queue TO service_role;
ALTER TABLE public.thinkific_sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sync queue"
  ON public.thinkific_sync_queue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE TRIGGER trg_thinkific_sync_queue_updated_at
  BEFORE UPDATE ON public.thinkific_sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. learning_pathways
CREATE TABLE IF NOT EXISTS public.learning_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_pathways TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.learning_pathways TO authenticated;
GRANT ALL ON public.learning_pathways TO service_role;
ALTER TABLE public.learning_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active pathways"
  ON public.learning_pathways FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE POLICY "Admins manage pathways"
  ON public.learning_pathways FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));
CREATE TRIGGER trg_learning_pathways_updated_at
  BEFORE UPDATE ON public.learning_pathways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.pathway_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES public.learning_pathways(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, product_id)
);
GRANT SELECT ON public.pathway_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pathway_products TO authenticated;
GRANT ALL ON public.pathway_products TO service_role;
ALTER TABLE public.pathway_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pathway products"
  ON public.pathway_products FOR SELECT USING (true);
CREATE POLICY "Admins manage pathway products"
  ON public.pathway_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'learner_admin'));

-- 6. saved_products
CREATE TABLE IF NOT EXISTS public.saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_products TO authenticated;
GRANT ALL ON public.saved_products TO service_role;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage their saved products"
  ON public.saved_products FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
