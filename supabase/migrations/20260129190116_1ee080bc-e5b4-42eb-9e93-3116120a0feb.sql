-- Drop the existing function first
DROP FUNCTION IF EXISTS generate_rbr_document_id(TEXT, UUID);

-- ============= RBR (Risk-Based Rationale) Node Tables =============
-- Supports FDA QMSR requirements effective February 2, 2026

-- Sample Size Rationale (RBR-SAM)
CREATE TABLE IF NOT EXISTS sample_size_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
  linked_hazard_id UUID REFERENCES hazards(id) ON DELETE SET NULL,
  failure_mode TEXT NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('Critical', 'Major', 'Minor')),
  sample_size INTEGER NOT NULL,
  confidence_level TEXT NOT NULL,
  statistical_method TEXT,
  rationale_text TEXT NOT NULL,
  qmsr_clause_reference TEXT DEFAULT '7.3.6',
  determination TEXT NOT NULL CHECK (determination IN ('Sample Size Justified', 'Increased Sample Required')),
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Design Change Rationale (RBR-DCH)
CREATE TABLE IF NOT EXISTS design_change_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_request_id UUID,
  change_description TEXT NOT NULL,
  change_classification TEXT NOT NULL CHECK (change_classification IN ('Minor', 'Major')),
  affected_design_outputs JSONB DEFAULT '[]',
  clinical_data_required BOOLEAN DEFAULT FALSE,
  regulatory_submission_required BOOLEAN DEFAULT FALSE,
  rationale_text TEXT NOT NULL,
  qmsr_clause_reference TEXT DEFAULT '7.3.9',
  determination TEXT NOT NULL CHECK (determination IN ('Proceed as Minor Change', 'Requires Full Re-Validation')),
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CAPA Priority Rationale (RBR-CAP) - HIGH FDA SCRUTINY
CREATE TABLE IF NOT EXISTS capa_priority_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_event_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('NCR', 'Audit Finding', 'Customer Complaint')),
  event_description TEXT NOT NULL,
  risk_assessment JSONB NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  promoted_to_capa BOOLEAN NOT NULL,
  capa_id UUID REFERENCES capa_records(id) ON DELETE SET NULL,
  rationale_text TEXT NOT NULL,
  qmsr_clause_reference TEXT DEFAULT '8.5',
  determination TEXT NOT NULL CHECK (determination IN ('CAPA Not Required - Correction Sufficient', 'CAPA Required')),
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sample_size_rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_change_rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE capa_priority_rationales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sample_size_rationales
CREATE POLICY "Users can view sample size rationales for their company"
  ON sample_size_rationales FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sample size rationales for their company"
  ON sample_size_rationales FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sample size rationales for their company"
  ON sample_size_rationales FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sample size rationales for their company"
  ON sample_size_rationales FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- RLS Policies for design_change_rationales
CREATE POLICY "Users can view design change rationales for their company"
  ON design_change_rationales FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create design change rationales for their company"
  ON design_change_rationales FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update design change rationales for their company"
  ON design_change_rationales FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete design change rationales for their company"
  ON design_change_rationales FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- RLS Policies for capa_priority_rationales
CREATE POLICY "Users can view capa priority rationales for their company"
  ON capa_priority_rationales FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create capa priority rationales for their company"
  ON capa_priority_rationales FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update capa priority rationales for their company"
  ON capa_priority_rationales FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete capa priority rationales for their company"
  ON capa_priority_rationales FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- Recreate the document ID generator with new prefixes
CREATE FUNCTION generate_rbr_document_id(prefix TEXT, p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq INTEGER;
  result TEXT;
BEGIN
  CASE prefix
    WHEN 'RBR-ENG' THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_id FROM 9) AS INTEGER)), 0) + 1 INTO next_seq
      FROM process_validation_rationales WHERE company_id = p_company_id;
    WHEN 'RBR-SUP' THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_id FROM 9) AS INTEGER)), 0) + 1 INTO next_seq
      FROM supplier_criticality_rationales WHERE company_id = p_company_id;
    WHEN 'RBR-SAM' THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_id FROM 9) AS INTEGER)), 0) + 1 INTO next_seq
      FROM sample_size_rationales WHERE company_id = p_company_id;
    WHEN 'RBR-DCH' THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_id FROM 9) AS INTEGER)), 0) + 1 INTO next_seq
      FROM design_change_rationales WHERE company_id = p_company_id;
    WHEN 'RBR-CAP' THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_id FROM 9) AS INTEGER)), 0) + 1 INTO next_seq
      FROM capa_priority_rationales WHERE company_id = p_company_id;
    ELSE
      next_seq := 1;
  END CASE;
  
  result := prefix || '-' || LPAD(next_seq::TEXT, 3, '0');
  RETURN result;
END;
$$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_rbr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sample_size_rationales_updated_at
  BEFORE UPDATE ON sample_size_rationales
  FOR EACH ROW EXECUTE FUNCTION update_rbr_updated_at();

CREATE TRIGGER update_design_change_rationales_updated_at
  BEFORE UPDATE ON design_change_rationales
  FOR EACH ROW EXECUTE FUNCTION update_rbr_updated_at();

CREATE TRIGGER update_capa_priority_rationales_updated_at
  BEFORE UPDATE ON capa_priority_rationales
  FOR EACH ROW EXECUTE FUNCTION update_rbr_updated_at();

-- Indexes
CREATE INDEX idx_sample_size_rationales_company ON sample_size_rationales(company_id);
CREATE INDEX idx_sample_size_rationales_product ON sample_size_rationales(product_id);
CREATE INDEX idx_design_change_rationales_company ON design_change_rationales(company_id);
CREATE INDEX idx_design_change_rationales_product ON design_change_rationales(product_id);
CREATE INDEX idx_capa_priority_rationales_company ON capa_priority_rationales(company_id);
CREATE INDEX idx_capa_priority_rationales_source ON capa_priority_rationales(source_event_id);