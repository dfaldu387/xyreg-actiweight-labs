-- Phase 1: Foundation & Database Schema Updates
-- Add bundle integration fields to feasibility_portfolios

ALTER TABLE feasibility_portfolios
ADD COLUMN IF NOT EXISTS source_bundle_id UUID REFERENCES product_bundles(id),
ADD COLUMN IF NOT EXISTS is_from_bundle BOOLEAN DEFAULT false;

-- Extend feasibility_portfolio_products with bundle member data
ALTER TABLE feasibility_portfolio_products
ADD COLUMN IF NOT EXISTS source_bundle_member_id UUID REFERENCES product_bundle_members(id),
ADD COLUMN IF NOT EXISTS development_status TEXT DEFAULT 'new_development',
ADD COLUMN IF NOT EXISTS lifecycle_type TEXT,
ADD COLUMN IF NOT EXISTS quantity_in_bundle INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS consumption_pattern JSONB,
ADD COLUMN IF NOT EXISTS skip_phase_analysis BOOLEAN DEFAULT false;

-- Add constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feasibility_portfolio_products_development_status_check') THEN
    ALTER TABLE feasibility_portfolio_products 
    ADD CONSTRAINT feasibility_portfolio_products_development_status_check 
    CHECK (development_status IN ('existing', 'new_development', 'modification', 'platform_variant'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feasibility_portfolio_products_lifecycle_type_check') THEN
    ALTER TABLE feasibility_portfolio_products 
    ADD CONSTRAINT feasibility_portfolio_products_lifecycle_type_check 
    CHECK (lifecycle_type IN ('permanent', 'consumable', 'accessory', 'software'));
  END IF;
END $$;

-- Create operational costs table
CREATE TABLE IF NOT EXISTS feasibility_operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES feasibility_portfolios(id) ON DELETE CASCADE,
  portfolio_product_id UUID REFERENCES feasibility_portfolio_products(id) ON DELETE CASCADE,
  direct_materials_cost NUMERIC DEFAULT 0,
  direct_labor_cost NUMERIC DEFAULT 0,
  variable_overhead_cost NUMERIC DEFAULT 0,
  variable_cost_per_unit NUMERIC DEFAULT 0,
  annual_variable_cost_change_percent NUMERIC DEFAULT 0,
  allocated_facility_costs NUMERIC DEFAULT 0,
  quality_compliance_costs NUMERIC DEFAULT 0,
  support_service_costs NUMERIC DEFAULT 0,
  distribution_costs NUMERIC DEFAULT 0,
  fixed_monthly_costs NUMERIC DEFAULT 0,
  annual_fixed_cost_change_percent NUMERIC DEFAULT 0,
  post_market_surveillance_annual NUMERIC DEFAULT 0,
  regulatory_fees_annual NUMERIC DEFAULT 0,
  quality_system_annual NUMERIC DEFAULT 0,
  worst_case_multiplier NUMERIC DEFAULT 1.3,
  likely_case_multiplier NUMERIC DEFAULT 1.0,
  best_case_multiplier NUMERIC DEFAULT 0.8,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  is_portfolio_level BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operational_costs_portfolio ON feasibility_operational_costs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_operational_costs_product ON feasibility_operational_costs(portfolio_product_id);

-- Create target markets table
CREATE TABLE IF NOT EXISTS feasibility_target_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES feasibility_portfolios(id) ON DELETE CASCADE,
  market_code TEXT NOT NULL,
  market_name TEXT NOT NULL,
  entry_timing_months INTEGER,
  expected_market_share_percent NUMERIC,
  pricing_strategy TEXT,
  regulatory_pathway TEXT,
  launch_priority INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_markets_portfolio ON feasibility_target_markets(portfolio_id);

-- Enable RLS
ALTER TABLE feasibility_operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feasibility_target_markets ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ 
BEGIN
  -- Operational costs policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'operational_costs_select') THEN
    CREATE POLICY operational_costs_select ON feasibility_operational_costs FOR SELECT
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'operational_costs_insert') THEN
    CREATE POLICY operational_costs_insert ON feasibility_operational_costs FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'operational_costs_update') THEN
    CREATE POLICY operational_costs_update ON feasibility_operational_costs FOR UPDATE
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'operational_costs_delete') THEN
    CREATE POLICY operational_costs_delete ON feasibility_operational_costs FOR DELETE
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;

  -- Target markets policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'target_markets_select') THEN
    CREATE POLICY target_markets_select ON feasibility_target_markets FOR SELECT
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'target_markets_insert') THEN
    CREATE POLICY target_markets_insert ON feasibility_target_markets FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'target_markets_update') THEN
    CREATE POLICY target_markets_update ON feasibility_target_markets FOR UPDATE
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'target_markets_delete') THEN
    CREATE POLICY target_markets_delete ON feasibility_target_markets FOR DELETE
      USING (EXISTS (SELECT 1 FROM feasibility_portfolios fp WHERE fp.id = portfolio_id AND EXISTS (SELECT 1 FROM user_company_access uca WHERE uca.company_id = fp.company_id AND uca.user_id = auth.uid())));
  END IF;
END $$;