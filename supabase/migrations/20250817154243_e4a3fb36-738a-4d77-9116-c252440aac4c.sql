-- Extend product_revenues table to include COGS and profit margin data
ALTER TABLE product_revenues 
ADD COLUMN IF NOT EXISTS cogs_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS units_sold integer DEFAULT 0;

-- Commercial performance forecasts table
CREATE TABLE IF NOT EXISTS commercial_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  forecast_month date NOT NULL,
  scenario_type text CHECK (scenario_type IN ('worst_case', 'likely_case', 'best_case')) NOT NULL,
  total_revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, forecast_month, scenario_type)
);

-- AI forecast factors for transparency
CREATE TABLE IF NOT EXISTS forecast_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  factor_name text NOT NULL,
  factor_description text,
  impact_weight numeric DEFAULT 0,
  data_source text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for commercial_forecasts
ALTER TABLE commercial_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS policies for commercial_forecasts
CREATE POLICY "Users can view commercial forecasts for their companies"
ON commercial_forecasts FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create commercial forecasts for their companies"
ON commercial_forecasts FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update commercial forecasts for their companies"
ON commercial_forecasts FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete commercial forecasts for their companies"
ON commercial_forecasts FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Enable RLS for forecast_factors
ALTER TABLE forecast_factors ENABLE ROW LEVEL SECURITY;

-- RLS policies for forecast_factors
CREATE POLICY "Users can view forecast factors for their companies"
ON forecast_factors FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create forecast factors for their companies"
ON forecast_factors FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can update forecast factors for their companies"
ON forecast_factors FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

CREATE POLICY "Users can delete forecast factors for their companies"
ON forecast_factors FOR DELETE
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() 
  AND access_level IN ('admin', 'editor')
));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_commercial_forecasts_updated_at
  BEFORE UPDATE ON commercial_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_forecast_factors_updated_at
  BEFORE UPDATE ON forecast_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();