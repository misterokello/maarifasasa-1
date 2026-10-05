-- Partner organisation groups (mirrors a Thinkific group) ------------------
CREATE TABLE public.partner_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_user_id uuid NOT NULL,
  organization_name text NOT NULL,
  thinkific_group_name text NOT NULL,
  thinkific_group_id bigint,
  contact_email text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_user_id, thinkific_group_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_groups TO authenticated;
GRANT ALL ON public.partner_groups TO service_role;
ALTER TABLE public.partner_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own groups"
ON public.partner_groups FOR SELECT TO authenticated
USING (partner_user_id = auth.uid());

CREATE POLICY "Learner admins manage partner groups"
ON public.partner_groups FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'));

CREATE TRIGGER partner_groups_updated_at
BEFORE UPDATE ON public.partner_groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Learners that belong to a Thinkific group -------------------------------
CREATE TABLE public.partner_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thinkific_group_name text NOT NULL,
  thinkific_group_id bigint,
  user_id uuid,
  email text NOT NULL,
  full_name text,
  thinkific_user_id bigint,
  source text NOT NULL DEFAULT 'bulk_import',
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thinkific_group_name, email)
);

CREATE INDEX partner_group_members_group_idx ON public.partner_group_members (lower(thinkific_group_name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_group_members TO authenticated;
GRANT ALL ON public.partner_group_members TO service_role;
ALTER TABLE public.partner_group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.partner_owns_group(_group_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_groups g
    WHERE g.partner_user_id = auth.uid()
      AND g.active
      AND lower(g.thinkific_group_name) = lower(_group_name)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.partner_owns_group(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_owns_group(text) TO authenticated, service_role;

CREATE POLICY "Partners view members of their groups"
ON public.partner_group_members FOR SELECT TO authenticated
USING (public.partner_owns_group(thinkific_group_name));

CREATE POLICY "Learner admins manage group members"
ON public.partner_group_members FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'learner_admin'));

-- Learner progress for a partner group ------------------------------------
CREATE OR REPLACE FUNCTION public.partner_group_learners(_group_name text)
RETURNS TABLE (
  email text,
  full_name text,
  user_id uuid,
  joined_at timestamptz,
  courses_enrolled integer,
  courses_completed integer,
  avg_progress numeric,
  last_activity timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    COALESCE(e.enrolled, 0)::int AS courses_enrolled,
    COALESCE(e.completed, 0)::int AS courses_completed,
    COALESCE(e.avg_progress, 0)::numeric AS avg_progress,
    e.last_activity
  FROM public.partner_group_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
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

REVOKE EXECUTE ON FUNCTION public.partner_group_learners(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_group_learners(text) TO authenticated, service_role;