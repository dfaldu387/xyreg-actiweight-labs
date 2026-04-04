-- Create product_reimbursement_codes table for tracking reimbursement codes per market
CREATE TABLE product_reimbursement_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market_code TEXT NOT NULL,
  code_type TEXT NOT NULL, -- CPT, HCPCS, DRG, EBM, OPS, G-DRG, CCAM, etc.
  code_value TEXT NOT NULL,
  code_description TEXT,
  coverage_status TEXT NOT NULL DEFAULT 'pending', -- exact_match, partial_match, pending, new_needed
  application_date DATE,
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_reimbursement_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access codes for products in their company
CREATE POLICY "Users can view reimbursement codes for their company products"
  ON product_reimbursement_codes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reimbursement codes for their company products"
  ON product_reimbursement_codes
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update reimbursement codes for their company products"
  ON product_reimbursement_codes
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reimbursement codes for their company products"
  ON product_reimbursement_codes
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_reimbursement_codes_product ON product_reimbursement_codes(product_id);
CREATE INDEX idx_reimbursement_codes_company ON product_reimbursement_codes(company_id);
CREATE INDEX idx_reimbursement_codes_market ON product_reimbursement_codes(market_code);

-- Create updated_at trigger
CREATE TRIGGER update_product_reimbursement_codes_updated_at
  BEFORE UPDATE ON product_reimbursement_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();