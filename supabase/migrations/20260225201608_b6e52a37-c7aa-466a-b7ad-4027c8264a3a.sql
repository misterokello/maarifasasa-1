
-- Create affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  commission_rate_override numeric NULL,
  payout_method text NULL,
  payout_details jsonb NULL,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  motivation text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create affiliate_products table
CREATE TABLE public.affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  commission_percent numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create affiliate_links table
CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, product_id)
);

-- Create affiliate_clicks table
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  ip_hash text NULL,
  user_agent text NULL,
  referrer text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create affiliate_conversions table
CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Affiliates RLS
CREATE POLICY "Users can view own affiliate record" ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate application" ON public.affiliates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates" ON public.affiliates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Affiliate products RLS
CREATE POLICY "Authenticated users can view active affiliate products" ON public.affiliate_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage affiliate products" ON public.affiliate_products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Affiliate links RLS
CREATE POLICY "Affiliates can view own links" ON public.affiliate_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Affiliates can insert own links" ON public.affiliate_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Admins can manage all affiliate links" ON public.affiliate_links
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Affiliate clicks RLS (public insert for tracking)
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all clicks" ON public.affiliate_clicks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view own link clicks" ON public.affiliate_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links al
      JOIN public.affiliates a ON a.id = al.affiliate_id
      WHERE al.id = link_id AND a.user_id = auth.uid()
    )
  );

-- Affiliate conversions RLS
CREATE POLICY "Affiliates can view own conversions" ON public.affiliate_conversions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all conversions" ON public.affiliate_conversions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for affiliates
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
