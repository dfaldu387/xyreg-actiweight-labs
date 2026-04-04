-- Add variant_id column to product_revenues table for variant-level revenue tracking
ALTER TABLE product_revenues 
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;

-- Create index for efficient variant revenue queries
CREATE INDEX IF NOT EXISTS idx_product_revenues_variant_id 
ON product_revenues(variant_id);

-- Create composite index for product and variant queries
CREATE INDEX IF NOT EXISTS idx_product_revenues_product_variant 
ON product_revenues(product_id, variant_id);

-- Create view for variant revenue aggregation
CREATE OR REPLACE VIEW variant_revenue_summary AS
SELECT 
  pr.product_id,
  pr.variant_id,
  pv.name as variant_name,
  pr.market_code,
  pr.currency_code,
  SUM(pr.revenue_amount) as total_revenue,
  SUM(pr.units_sold) as total_units,
  AVG(pr.revenue_amount) as avg_revenue,
  COUNT(*) as entry_count,
  MIN(pr.period_start) as first_period,
  MAX(pr.period_end) as last_period
FROM product_revenues pr
LEFT JOIN product_variants pv ON pv.id = pr.variant_id
GROUP BY pr.product_id, pr.variant_id, pv.name, pr.market_code, pr.currency_code;

-- Create table for product-level variant distribution settings
CREATE TABLE IF NOT EXISTS product_variant_distribution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  distribution_percentage numeric(5,2) NOT NULL CHECK (distribution_percentage >= 0 AND distribution_percentage <= 100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_id)
);

-- Enable RLS on new table
ALTER TABLE product_variant_distribution_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variant_distribution_settings
CREATE POLICY "Users can view variant distributions for their companies"
ON product_variant_distribution_settings FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create variant distributions for their companies"
ON product_variant_distribution_settings FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can update variant distributions for their companies"
ON product_variant_distribution_settings FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Users can delete variant distributions for their companies"
ON product_variant_distribution_settings FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() 
    AND access_level IN ('admin', 'editor')
  )
);

-- Create indexes for the new table
CREATE INDEX idx_variant_dist_settings_company ON product_variant_distribution_settings(company_id);
CREATE INDEX idx_variant_dist_settings_product ON product_variant_distribution_settings(product_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_variant_distribution_settings_updated_at
BEFORE UPDATE ON product_variant_distribution_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();