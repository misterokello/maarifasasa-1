ALTER TABLE public.products ADD COLUMN IF NOT EXISTS program_type TEXT;
COMMENT ON COLUMN public.products.program_type IS 'For category=program: talent_accelerator | partner_program';