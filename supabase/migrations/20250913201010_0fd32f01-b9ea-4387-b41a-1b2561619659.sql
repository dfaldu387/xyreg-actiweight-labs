-- Create missing tables and add RLS policies

-- Create rNPV scenarios table for scenario analysis
CREATE TABLE public.rnpv_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  core_project_config JSONB NOT NULL DEFAULT '{}',
  active_markets JSONB NOT NULL DEFAULT '[]',
  loa_adjustments JSONB NOT NULL DEFAULT '{}',
  is_baseline BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create detailed rNPV calculations table  
CREATE TABLE public.rnpv_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES public.rnpv_scenarios(id) ON DELETE CASCADE,
  rnpv_product_id UUID NOT NULL, -- use different name to avoid conflict
  company_id UUID NOT NULL,
  calculation_type TEXT NOT NULL, -- 'core_project', 'market_extension', 'total_portfolio'
  market_code TEXT, -- NULL for core project calculations
  
  -- Calculation results
  expected_cost_pv NUMERIC(15,2) NOT NULL DEFAULT 0,
  expected_revenue_pv NUMERIC(15,2) NOT NULL DEFAULT 0,
  rnpv_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Risk components
  cumulative_technical_loa NUMERIC(5,4) NOT NULL DEFAULT 1.0,
  cumulative_commercial_loa NUMERIC(5,4) NOT NULL DEFAULT 1.0,
  
  -- Calculation details
  phase_calculations JSONB NOT NULL DEFAULT '[]',
  calculation_metadata JSONB NOT NULL DEFAULT '{}',
  
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calculation_version TEXT NOT NULL DEFAULT '1.0'
);

-- Create expert LoA assessments table for collaborative workflow
CREATE TABLE public.expert_loa_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_product_id UUID NOT NULL, -- use different name to avoid conflict
  company_id UUID NOT NULL,
  phase_id UUID NOT NULL,
  expert_user_id UUID NOT NULL,
  expert_email TEXT,
  expert_name TEXT,
  expert_role TEXT,
  
  -- Assessment details
  assessed_loa NUMERIC(5,2) NOT NULL, -- 0-100 percentage
  confidence_level TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  justification TEXT,
  risk_factors JSONB DEFAULT '[]',
  
  -- Workflow status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, submitted, approved, rejected
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_rnpv_scenarios_product ON public.rnpv_scenarios(product_id);
CREATE INDEX idx_rnpv_calculations_scenario ON public.rnpv_calculations(scenario_id);
CREATE INDEX idx_rnpv_calculations_product ON public.rnpv_calculations(rnpv_product_id);
CREATE INDEX idx_expert_assessments_product ON public.expert_loa_assessments(assessment_product_id);
CREATE INDEX idx_expert_assessments_phase ON public.expert_loa_assessments(phase_id);

-- Enable RLS
ALTER TABLE public.rnpv_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnpv_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_loa_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rnpv_scenarios
CREATE POLICY "Users can view rNPV scenarios for their companies" 
ON public.rnpv_scenarios FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create rNPV scenarios for their companies" 
ON public.rnpv_scenarios FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update rNPV scenarios for their companies" 
ON public.rnpv_scenarios FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can delete rNPV scenarios for their companies" 
ON public.rnpv_scenarios FOR DELETE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for rnpv_calculations
CREATE POLICY "Users can view rNPV calculations for their companies" 
ON public.rnpv_calculations FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create rNPV calculations for their companies" 
ON public.rnpv_calculations FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Users can update rNPV calculations for their companies" 
ON public.rnpv_calculations FOR UPDATE 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- RLS Policies for expert_loa_assessments
CREATE POLICY "Users can view expert assessments for their companies" 
ON public.expert_loa_assessments FOR SELECT 
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create expert assessments for their companies" 
ON public.expert_loa_assessments FOR INSERT 
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

CREATE POLICY "Experts can update their own assessments" 
ON public.expert_loa_assessments FOR UPDATE 
USING (expert_user_id = auth.uid() OR company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid() 
  AND user_company_access.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type])
));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_rnpv_scenarios_updated_at
  BEFORE UPDATE ON public.rnpv_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_expert_loa_assessments_updated_at
  BEFORE UPDATE ON public.expert_loa_assessments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();