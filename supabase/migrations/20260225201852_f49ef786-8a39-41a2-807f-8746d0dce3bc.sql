
-- Create function to increment affiliate link clicks
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(link_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_links
  SET clicks = clicks + 1
  WHERE id = link_id_param;
END;
$$;

-- Add RLS policy for admins to read profiles (needed for affiliate management join)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
