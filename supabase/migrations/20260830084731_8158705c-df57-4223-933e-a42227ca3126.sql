-- Persist the learner's selected goals on their profile so personalised
-- course/pathway ordering survives across devices and sessions.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learner_goals text[] NOT NULL DEFAULT '{}'::text[];