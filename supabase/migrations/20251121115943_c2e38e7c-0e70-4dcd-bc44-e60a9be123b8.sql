-- Create company_business_canvas table for company-level Business Model Canvas
CREATE TABLE company_business_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key_partners TEXT,
  key_activities TEXT,
  key_resources TEXT,
  value_propositions TEXT,
  customer_relationships TEXT,
  channels TEXT,
  customer_segments TEXT,
  cost_structure TEXT,
  revenue_streams TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Create index for performance
CREATE INDEX idx_company_business_canvas_company ON company_business_canvas(company_id);

-- Enable RLS
ALTER TABLE company_business_canvas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view company canvas if they have access to the company
CREATE POLICY "Users can view company canvas for their companies"
  ON company_business_canvas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access
      WHERE user_company_access.company_id = company_business_canvas.company_id
      AND user_company_access.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert company canvas if they have admin/editor access to the company
CREATE POLICY "Users can insert company canvas for their companies"
  ON company_business_canvas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_company_access
      WHERE user_company_access.company_id = company_business_canvas.company_id
      AND user_company_access.user_id = auth.uid()
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  );

-- RLS Policy: Users can update company canvas if they have admin/editor access to the company
CREATE POLICY "Users can update company canvas for their companies"
  ON company_business_canvas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access
      WHERE user_company_access.company_id = company_business_canvas.company_id
      AND user_company_access.user_id = auth.uid()
      AND user_company_access.access_level IN ('admin', 'editor')
    )
  );

-- RLS Policy: Users can delete company canvas if they have admin access to the company
CREATE POLICY "Users can delete company canvas for their companies"
  ON company_business_canvas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access
      WHERE user_company_access.company_id = company_business_canvas.company_id
      AND user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_company_business_canvas_updated_at
  BEFORE UPDATE ON company_business_canvas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();