-- Feasibility Portfolio System - Phase 1: Foundation Tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Feasibility Portfolios Table
CREATE TABLE IF NOT EXISTS public.feasibility_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'analysis', 'under_review', 'approved', 'rejected', 'on_hold')),
  decision_date DATE,
  decision_rationale TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_launch_year INTEGER,
  strategic_priority TEXT DEFAULT 'medium' CHECK (strategic_priority IN ('high', 'medium', 'low')),
  loa_methodology TEXT DEFAULT 'simple' CHECK (loa_methodology IN ('simple', 'phase_based')),
  loa_scope TEXT DEFAULT 'portfolio_level' CHECK (loa_scope IN ('portfolio_level', 'product_level')),
  custom_risk_categories JSONB DEFAULT '[]'::jsonb
);

-- 2. Portfolio Products Table (links products to portfolios)
CREATE TABLE IF NOT EXISTS public.feasibility_portfolio_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  role TEXT DEFAULT 'other' CHECK (role IN ('primary', 'accessory', 'software', 'consumable', 'other')),
  is_placeholder BOOLEAN DEFAULT TRUE,
  will_split_into_variants BOOLEAN DEFAULT FALSE,
  expected_variant_count INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Risk Assessments Table
CREATE TABLE IF NOT EXISTS public.feasibility_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  portfolio_product_id UUID REFERENCES public.feasibility_portfolio_products(id) ON DELETE CASCADE,
  risk_category TEXT NOT NULL,
  likelihood_of_approval NUMERIC(5,2) NOT NULL CHECK (likelihood_of_approval >= 0 AND likelihood_of_approval <= 100),
  justification TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  impact_on_valuation TEXT CHECK (impact_on_valuation IN ('low', 'medium', 'high', 'critical')),
  mitigation_plan TEXT,
  is_custom_category BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Phase Templates Table
CREATE TABLE IF NOT EXISTS public.feasibility_phase_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  portfolio_product_id UUID REFERENCES public.feasibility_portfolio_products(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_description TEXT,
  likelihood_of_approval NUMERIC(5,2) NOT NULL CHECK (likelihood_of_approval >= 0 AND likelihood_of_approval <= 100),
  estimated_duration_months INTEGER,
  estimated_cost_worst NUMERIC(12,2),
  estimated_cost_likely NUMERIC(12,2),
  estimated_cost_best NUMERIC(12,2),
  phase_dependencies TEXT[],
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Budget Items Table
CREATE TABLE IF NOT EXISTS public.feasibility_budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  portfolio_product_id UUID REFERENCES public.feasibility_portfolio_products(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('development_rd', 'regulatory', 'clinical', 'manufacturing_setup', 'marketing', 'distribution', 'other')),
  item_name TEXT NOT NULL,
  description TEXT,
  worst_case NUMERIC(12,2),
  likely_case NUMERIC(12,2),
  best_case NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  is_portfolio_level BOOLEAN DEFAULT FALSE,
  timing_months_from_start INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Revenue Projections Table
CREATE TABLE IF NOT EXISTS public.feasibility_revenue_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  portfolio_product_id UUID NOT NULL REFERENCES public.feasibility_portfolio_products(id) ON DELETE CASCADE,
  target_market TEXT NOT NULL,
  year_from_launch INTEGER NOT NULL,
  worst_case_revenue NUMERIC(12,2),
  likely_case_revenue NUMERIC(12,2),
  best_case_revenue NUMERIC(12,2),
  market_share_assumption NUMERIC(5,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Financial Analysis Table
CREATE TABLE IF NOT EXISTS public.feasibility_financial_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scenario TEXT NOT NULL CHECK (scenario IN ('worst', 'likely', 'best')),
  total_investment NUMERIC(12,2),
  total_revenue_pv NUMERIC(12,2),
  rnpv NUMERIC(12,2),
  roi_percentage NUMERIC(8,2),
  break_even_years NUMERIC(5,2),
  irr_percentage NUMERIC(8,2),
  discount_rate NUMERIC(5,2),
  technical_loa NUMERIC(5,2),
  commercial_loa NUMERIC(5,2),
  calculation_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Assumptions Table
CREATE TABLE IF NOT EXISTS public.feasibility_assumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  assumption_category TEXT NOT NULL,
  assumption_text TEXT NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  impact_if_wrong TEXT CHECK (impact_if_wrong IN ('low', 'medium', 'high', 'critical')),
  mitigation_plan TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Cannibalization Table
CREATE TABLE IF NOT EXISTS public.feasibility_cannibalization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.feasibility_portfolios(id) ON DELETE CASCADE,
  affected_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cannibalization_percentage NUMERIC(5,2) NOT NULL CHECK (cannibalization_percentage >= 0 AND cannibalization_percentage <= 100),
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_feasibility_portfolios_company ON public.feasibility_portfolios(company_id);
CREATE INDEX idx_feasibility_portfolios_status ON public.feasibility_portfolios(status);
CREATE INDEX idx_portfolio_products_portfolio ON public.feasibility_portfolio_products(portfolio_id);
CREATE INDEX idx_portfolio_products_product ON public.feasibility_portfolio_products(product_id);
CREATE INDEX idx_risk_assessments_portfolio ON public.feasibility_risk_assessments(portfolio_id);
CREATE INDEX idx_risk_assessments_product ON public.feasibility_risk_assessments(portfolio_product_id);
CREATE INDEX idx_phase_templates_portfolio ON public.feasibility_phase_templates(portfolio_id);
CREATE INDEX idx_phase_templates_product ON public.feasibility_phase_templates(portfolio_product_id);
CREATE INDEX idx_budget_items_portfolio ON public.feasibility_budget_items(portfolio_id);
CREATE INDEX idx_revenue_projections_portfolio ON public.feasibility_revenue_projections(portfolio_id);
CREATE INDEX idx_revenue_projections_product ON public.feasibility_revenue_projections(portfolio_product_id);
CREATE INDEX idx_financial_analysis_portfolio ON public.feasibility_financial_analysis(portfolio_id);
CREATE INDEX idx_assumptions_portfolio ON public.feasibility_assumptions(portfolio_id);
CREATE INDEX idx_cannibalization_portfolio ON public.feasibility_cannibalization(portfolio_id);

-- Enable Row Level Security
ALTER TABLE public.feasibility_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_portfolio_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_revenue_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_financial_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_cannibalization ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feasibility_portfolios
CREATE POLICY "Users can view portfolios from their company"
  ON public.feasibility_portfolios FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create portfolios for their company"
  ON public.feasibility_portfolios FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update portfolios from their company"
  ON public.feasibility_portfolios FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete portfolios from their company"
  ON public.feasibility_portfolios FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for feasibility_portfolio_products
CREATE POLICY "Users can view portfolio products from their company"
  ON public.feasibility_portfolio_products FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create portfolio products for their company"
  ON public.feasibility_portfolio_products FOR INSERT
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update portfolio products from their company"
  ON public.feasibility_portfolio_products FOR UPDATE
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete portfolio products from their company"
  ON public.feasibility_portfolio_products FOR DELETE
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_risk_assessments
CREATE POLICY "Users can view risk assessments from their company"
  ON public.feasibility_risk_assessments FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage risk assessments for their company"
  ON public.feasibility_risk_assessments FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_phase_templates
CREATE POLICY "Users can view phase templates from their company"
  ON public.feasibility_phase_templates FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage phase templates for their company"
  ON public.feasibility_phase_templates FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_budget_items
CREATE POLICY "Users can view budget items from their company"
  ON public.feasibility_budget_items FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage budget items for their company"
  ON public.feasibility_budget_items FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_revenue_projections
CREATE POLICY "Users can view revenue projections from their company"
  ON public.feasibility_revenue_projections FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage revenue projections for their company"
  ON public.feasibility_revenue_projections FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_financial_analysis
CREATE POLICY "Users can view financial analysis from their company"
  ON public.feasibility_financial_analysis FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage financial analysis for their company"
  ON public.feasibility_financial_analysis FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_assumptions
CREATE POLICY "Users can view assumptions from their company"
  ON public.feasibility_assumptions FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage assumptions for their company"
  ON public.feasibility_assumptions FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for feasibility_cannibalization
CREATE POLICY "Users can view cannibalization from their company"
  ON public.feasibility_cannibalization FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage cannibalization for their company"
  ON public.feasibility_cannibalization FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.feasibility_portfolios WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_feasibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_feasibility_portfolios_updated_at
  BEFORE UPDATE ON public.feasibility_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();

CREATE TRIGGER update_feasibility_portfolio_products_updated_at
  BEFORE UPDATE ON public.feasibility_portfolio_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();

CREATE TRIGGER update_feasibility_risk_assessments_updated_at
  BEFORE UPDATE ON public.feasibility_risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();

CREATE TRIGGER update_feasibility_phase_templates_updated_at
  BEFORE UPDATE ON public.feasibility_phase_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();

CREATE TRIGGER update_feasibility_budget_items_updated_at
  BEFORE UPDATE ON public.feasibility_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();

CREATE TRIGGER update_feasibility_assumptions_updated_at
  BEFORE UPDATE ON public.feasibility_assumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feasibility_updated_at();