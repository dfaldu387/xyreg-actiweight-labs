-- Create only the missing tables for rNPV enhancement

-- Create rNPV scenarios table for scenario analysis
CREATE TABLE IF NOT EXISTS public.rnpv_scenarios (
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
CREATE TABLE IF NOT EXISTS public.rnpv_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES public.rnpv_scenarios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.expert_loa_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
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

-- Add missing columns to market_extensions if they don't exist
DO $$ 
BEGIN
  -- Check if market_extensions exists and add missing columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_extensions' AND table_schema = 'public') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_extensions' AND column_name = 'regulatory_phases') THEN
      ALTER TABLE public.market_extensions ADD COLUMN regulatory_phases JSONB NOT NULL DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_extensions' AND column_name = 'commercial_factors') THEN
      ALTER TABLE public.market_extensions ADD COLUMN commercial_factors JSONB NOT NULL DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_extensions' AND column_name = 'market_specific_costs') THEN
      ALTER TABLE public.market_extensions ADD COLUMN market_specific_costs JSONB NOT NULL DEFAULT '{}';
    END IF;
  ELSE
    -- Create market_extensions table if it doesn't exist
    CREATE TABLE public.market_extensions (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      product_id UUID NOT NULL,
      company_id UUID NOT NULL,
      market_code TEXT NOT NULL,
      market_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      revenue_forecast JSONB NOT NULL DEFAULT '{}',
      market_specific_costs JSONB NOT NULL DEFAULT '{}',
      regulatory_phases JSONB NOT NULL DEFAULT '[]',
      commercial_factors JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      created_by UUID,
      CONSTRAINT unique_product_market UNIQUE(product_id, market_code)
    );
  END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_market_extensions_product ON public.market_extensions(product_id);
CREATE INDEX IF NOT EXISTS idx_market_extensions_company ON public.market_extensions(company_id);
CREATE INDEX IF NOT EXISTS idx_rnpv_scenarios_product ON public.rnpv_scenarios(product_id);
CREATE INDEX IF NOT EXISTS idx_rnpv_calculations_scenario ON public.rnpv_calculations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_rnpv_calculations_product ON public.rnpv_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_expert_assessments_product ON public.expert_loa_assessments(product_id);
CREATE INDEX IF NOT EXISTS idx_expert_assessments_phase ON public.expert_loa_assessments(phase_id);

-- Enable RLS (idempotent)
ALTER TABLE public.market_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnpv_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnpv_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_loa_assessments ENABLE ROW LEVEL SECURITY;