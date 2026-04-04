-- Create product_unit_economics table
CREATE TABLE public.product_unit_economics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_acquisition_cost NUMERIC(12,2),
  cac_currency TEXT DEFAULT 'EUR',
  cogs_per_unit NUMERIC(12,2),
  cogs_currency TEXT DEFAULT 'EUR',
  gross_margin_percent NUMERIC(5,2),
  payback_period_months INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create product_gtm_strategy table
CREATE TABLE public.product_gtm_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channels JSONB DEFAULT '[]'::jsonb,
  territory_priority JSONB DEFAULT '[]'::jsonb,
  buyer_persona TEXT,
  budget_cycle TEXT,
  sales_cycle_weeks INTEGER,
  customers_for_1m_arr INTEGER,
  customers_for_5m_arr INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create product_use_of_proceeds table
CREATE TABLE public.product_use_of_proceeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rd_percent NUMERIC(5,2) DEFAULT 0,
  rd_activities TEXT,
  regulatory_percent NUMERIC(5,2) DEFAULT 0,
  regulatory_activities TEXT,
  team_percent NUMERIC(5,2) DEFAULT 0,
  team_activities TEXT,
  commercial_percent NUMERIC(5,2) DEFAULT 0,
  commercial_activities TEXT,
  operations_percent NUMERIC(5,2) DEFAULT 0,
  operations_activities TEXT,
  total_raise_amount NUMERIC(12,2),
  raise_currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create product_key_risks table
CREATE TABLE public.product_key_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_1_description TEXT,
  risk_1_likelihood TEXT,
  risk_1_impact TEXT,
  risk_1_mitigation TEXT,
  risk_1_fallback TEXT,
  risk_2_description TEXT,
  risk_2_likelihood TEXT,
  risk_2_impact TEXT,
  risk_2_mitigation TEXT,
  risk_2_fallback TEXT,
  risk_3_description TEXT,
  risk_3_likelihood TEXT,
  risk_3_impact TEXT,
  risk_3_mitigation TEXT,
  risk_3_fallback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Create product_manufacturing table
CREATE TABLE public.product_manufacturing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  current_stage TEXT,
  commercial_location TEXT,
  commercial_model TEXT,
  cmo_partners JSONB DEFAULT '[]'::jsonb,
  cogs_at_scale NUMERIC(12,2),
  cogs_at_scale_currency TEXT DEFAULT 'EUR',
  single_source_components JSONB DEFAULT '[]'::jsonb,
  supply_chain_risks TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.product_unit_economics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_gtm_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_use_of_proceeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_key_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_manufacturing ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_unit_economics
CREATE POLICY "Users can view unit economics for their company" ON public.product_unit_economics
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert unit economics for their company" ON public.product_unit_economics
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update unit economics for their company" ON public.product_unit_economics
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete unit economics for their company" ON public.product_unit_economics
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- RLS policies for product_gtm_strategy
CREATE POLICY "Users can view gtm strategy for their company" ON public.product_gtm_strategy
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert gtm strategy for their company" ON public.product_gtm_strategy
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update gtm strategy for their company" ON public.product_gtm_strategy
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete gtm strategy for their company" ON public.product_gtm_strategy
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- RLS policies for product_use_of_proceeds
CREATE POLICY "Users can view use of proceeds for their company" ON public.product_use_of_proceeds
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert use of proceeds for their company" ON public.product_use_of_proceeds
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update use of proceeds for their company" ON public.product_use_of_proceeds
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete use of proceeds for their company" ON public.product_use_of_proceeds
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- RLS policies for product_key_risks
CREATE POLICY "Users can view key risks for their company" ON public.product_key_risks
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert key risks for their company" ON public.product_key_risks
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update key risks for their company" ON public.product_key_risks
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete key risks for their company" ON public.product_key_risks
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- RLS policies for product_manufacturing
CREATE POLICY "Users can view manufacturing for their company" ON public.product_manufacturing
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert manufacturing for their company" ON public.product_manufacturing
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update manufacturing for their company" ON public.product_manufacturing
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete manufacturing for their company" ON public.product_manufacturing
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_product_unit_economics_updated_at BEFORE UPDATE ON public.product_unit_economics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_product_gtm_strategy_updated_at BEFORE UPDATE ON public.product_gtm_strategy
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_product_use_of_proceeds_updated_at BEFORE UPDATE ON public.product_use_of_proceeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_product_key_risks_updated_at BEFORE UPDATE ON public.product_key_risks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_product_manufacturing_updated_at BEFORE UPDATE ON public.product_manufacturing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public access for investor view (when share is active)
CREATE POLICY "Public can view unit economics via active share" ON public.product_unit_economics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    WHERE ciss.featured_product_id = product_unit_economics.product_id AND ciss.is_active = true
  ));
CREATE POLICY "Public can view gtm strategy via active share" ON public.product_gtm_strategy
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    WHERE ciss.featured_product_id = product_gtm_strategy.product_id AND ciss.is_active = true
  ));
CREATE POLICY "Public can view use of proceeds via active share" ON public.product_use_of_proceeds
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    WHERE ciss.featured_product_id = product_use_of_proceeds.product_id AND ciss.is_active = true
  ));
CREATE POLICY "Public can view key risks via active share" ON public.product_key_risks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    WHERE ciss.featured_product_id = product_key_risks.product_id AND ciss.is_active = true
  ));
CREATE POLICY "Public can view manufacturing via active share" ON public.product_manufacturing
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.company_investor_share_settings ciss
    WHERE ciss.featured_product_id = product_manufacturing.product_id AND ciss.is_active = true
  ));

-- Add visibility toggle columns to company_investor_share_settings
ALTER TABLE public.company_investor_share_settings
  ADD COLUMN IF NOT EXISTS show_unit_economics BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_gtm_strategy BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_use_of_proceeds BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_key_risks BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_manufacturing BOOLEAN DEFAULT true;