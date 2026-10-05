CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  organisation_name text,
  role_title text,
  contact_email text,
  contact_phone text,
  website text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.partner_profiles TO authenticated;
GRANT ALL ON public.partner_profiles TO service_role;

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own profile" ON public.partner_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'));

CREATE POLICY "Partners create own profile" ON public.partner_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'));

CREATE POLICY "Partners update own profile" ON public.partner_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'));

CREATE TRIGGER trg_partner_profiles_updated
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.partner_group_members
  ADD COLUMN IF NOT EXISTS last_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.partner_group_roster(_group_name text)
RETURNS TABLE(
  email text,
  full_name text,
  user_id uuid,
  joined_at timestamptz,
  has_account boolean,
  account_confirmed boolean,
  last_invited_at timestamptz,
  invite_count integer,
  thinkific_user_id bigint,
  courses_enrolled integer,
  courses_completed integer,
  avg_progress numeric,
  last_activity timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.partner_owns_group(_group_name)
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'learner_admin')
  ) THEN
    RAISE EXCEPTION 'Not authorised for this group';
  END IF;

  RETURN QUERY
  SELECT
    m.email,
    COALESCE(p.full_name, m.full_name) AS full_name,
    m.user_id,
    m.created_at AS joined_at,
    (m.user_id IS NOT NULL) AS has_account,
    (u.email_confirmed_at IS NOT NULL OR u.last_sign_in_at IS NOT NULL) AS account_confirmed,
    m.last_invited_at,
    COALESCE(m.invite_count, 0) AS invite_count,
    m.thinkific_user_id,
    COALESCE(e.enrolled, 0)::int AS courses_enrolled,
    COALESCE(e.completed, 0)::int AS courses_completed,
    COALESCE(e.avg_progress, 0)::numeric AS avg_progress,
    e.last_activity
  FROM public.partner_group_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN (
    SELECT
      en.user_id,
      COUNT(*) AS enrolled,
      COUNT(*) FILTER (WHERE en.completed_at IS NOT NULL OR en.progress_percent >= 100) AS completed,
      ROUND(AVG(COALESCE(en.progress_percent, 0)), 1) AS avg_progress,
      MAX(COALESCE(en.last_synced_at, en.updated_at)) AS last_activity
    FROM public.enrollments en
    GROUP BY en.user_id
  ) e ON e.user_id = m.user_id
  WHERE lower(m.thinkific_group_name) = lower(_group_name)
  ORDER BY COALESCE(p.full_name, m.full_name, m.email);
END;
$$;