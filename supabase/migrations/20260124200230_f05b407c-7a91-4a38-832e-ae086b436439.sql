-- Create a table to store Tally form submissions
CREATE TABLE public.tally_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tally_submission_id TEXT NOT NULL UNIQUE,
  form_id TEXT NOT NULL,
  form_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by form
CREATE INDEX idx_tally_submissions_form_id ON public.tally_submissions(form_id);
CREATE INDEX idx_tally_submissions_submitted_at ON public.tally_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.tally_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view submissions
CREATE POLICY "Admins can view all submissions"
ON public.tally_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage submissions
CREATE POLICY "Admins can manage submissions"
ON public.tally_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_tally_submissions_updated_at
BEFORE UPDATE ON public.tally_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();