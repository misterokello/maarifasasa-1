ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS portal_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_reminded_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_activated_at timestamptz;