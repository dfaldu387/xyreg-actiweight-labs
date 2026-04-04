-- Add company logo field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create product viability scorecards table
CREATE TABLE IF NOT EXISTS product_viability_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Step 1: Regulatory Strategy
  regulatory_framework TEXT NOT NULL, -- 'EU_MDR', 'EU_IVDR', 'US_FDA'
  device_class TEXT NOT NULL,
  has_predicate TEXT, -- For US FDA only
  
  -- Step 2: Clinical Burden
  clinical_strategy TEXT[], -- Array for multi-select
  patient_count INTEGER,
  
  -- Step 3: Reimbursement
  reimbursement_code TEXT,
  
  -- Step 4: Technical Complexity
  technology_type TEXT,
  
  -- Scores
  total_score INTEGER NOT NULL,
  regulatory_score INTEGER NOT NULL,
  clinical_score INTEGER NOT NULL,
  reimbursement_score INTEGER NOT NULL,
  technical_score INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE product_viability_scorecards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_viability_scorecards
CREATE POLICY "Users can view scorecards for their company products"
  ON product_viability_scorecards FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scorecards for their company products"
  ON product_viability_scorecards FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scorecards for their company products"
  ON product_viability_scorecards FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scorecards for their company products"
  ON product_viability_scorecards FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_viability_scorecards_updated_at
  BEFORE UPDATE ON product_viability_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Add featured_product_id to company_investor_share_settings for product selection
ALTER TABLE company_investor_share_settings 
ADD COLUMN IF NOT EXISTS featured_product_id UUID REFERENCES products(id) ON DELETE SET NULL;