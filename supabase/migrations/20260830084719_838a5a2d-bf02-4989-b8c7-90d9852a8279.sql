-- Enterprise "Request a demo" submissions from the public site.
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  work_email text NOT NULL,
  organisation text NOT NULL,
  role text,
  phone text,
  audience text NOT NULL DEFAULT 'enterprise',
  interest text,
  message text,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text,
  status text NOT NULL DEFAULT 'new',
  source text,
  experiments jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.demo_requests TO anon;
GRANT INSERT ON public.demo_requests TO authenticated;
GRANT SELECT, UPDATE ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a demo request (public lead capture form).
DROP POLICY IF EXISTS "Anyone can request a demo" ON public.demo_requests;
CREATE POLICY "Anyone can request a demo"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read or manage the resulting leads.
DROP POLICY IF EXISTS "Admins can view demo requests" ON public.demo_requests;
CREATE POLICY "Admins can view demo requests"
ON public.demo_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update demo requests" ON public.demo_requests;
CREATE POLICY "Admins can update demo requests"
ON public.demo_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests (status);