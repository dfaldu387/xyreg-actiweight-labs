-- Create table for storing rNPV analysis inputs
CREATE TABLE public.product_rnpv_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- Market parameters
  target_markets JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_addressable_market NUMERIC(15,2) NOT NULL DEFAULT 1000000,
  expected_market_share NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  launch_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE) + 2,
  product_lifespan INTEGER NOT NULL DEFAULT 10,
  
  -- Revenue model
  average_selling_price NUMERIC(12,2) NOT NULL DEFAULT 1000,
  annual_price_change NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  annual_volume_growth NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  
  -- Cost structure
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 600,
  annual_cost_change NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  fixed_costs NUMERIC(12,2) NOT NULL DEFAULT 500000,
  
  -- Financial parameters
  discount_rate NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  
  -- Risk factors
  market_risk NUMERIC(5,2) NOT NULL DEFAULT 15.0,
  competitive_risk NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  technical_risk NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  regulatory_risk NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  
  -- Cannibalization settings
  cannibalization_enabled BOOLEAN NOT NULL DEFAULT false,
  affected_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_synergies NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  
  -- Metadata
  analysis_name TEXT NOT NULL DEFAULT 'Default Analysis',
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.product_rnpv_inputs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view rNPV inputs for their companies" 
ON public.product_rnpv_inputs 
FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create rNPV inputs for their companies" 
ON public.product_rnpv_inputs 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update rNPV inputs for their companies" 
ON public.product_rnpv_inputs 
FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete rNPV inputs for their companies" 
ON public.product_rnpv_inputs 
FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create indexes for performance
CREATE INDEX idx_product_rnpv_inputs_product_id ON public.product_rnpv_inputs(product_id);
CREATE INDEX idx_product_rnpv_inputs_company_id ON public.product_rnpv_inputs(company_id);
CREATE INDEX idx_product_rnpv_inputs_created_by ON public.product_rnpv_inputs(created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_product_rnpv_inputs_updated_at
  BEFORE UPDATE ON public.product_rnpv_inputs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();