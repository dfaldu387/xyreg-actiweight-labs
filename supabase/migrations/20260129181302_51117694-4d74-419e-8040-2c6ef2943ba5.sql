-- Process Validation Rationales (Engineering/Lab)
-- Document ID format: RBR-ENG-{ID}
CREATE TABLE public.process_validation_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity
  activity_description TEXT NOT NULL,
  process_type TEXT NOT NULL CHECK (process_type IN ('manufacturing', 'design_verification', 'test_method', 'other')),
  
  -- Risk Classification (from RMF)
  hazard_identified TEXT NOT NULL,
  linked_hazard_id UUID REFERENCES public.hazards(id) ON DELETE SET NULL,
  severity_of_harm TEXT NOT NULL CHECK (severity_of_harm IN ('Critical', 'Major', 'Minor')),
  probability_of_occurrence TEXT NOT NULL CHECK (probability_of_occurrence IN ('Frequent', 'Occasional', 'Remote')),
  
  -- AI-Generated Rationale
  rationale_text TEXT NOT NULL,
  validation_rigor TEXT NOT NULL CHECK (validation_rigor IN ('High', 'Medium', 'Low')),
  confidence_interval TEXT,
  qmsr_clause_reference TEXT,
  determination TEXT NOT NULL CHECK (determination IN ('Proceed with High Rigor Validation', 'Proceed with Standard Verification')),
  
  -- Audit Trail
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Criticality Rationales (Business/Supplier)
-- Document ID format: RBR-SUP-{ID}
CREATE TABLE public.supplier_criticality_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Supplier Context
  component_role TEXT NOT NULL,
  safety_impact TEXT NOT NULL CHECK (safety_impact IN ('Direct Impact', 'Indirect Impact', 'No Impact')),
  criticality_class TEXT NOT NULL CHECK (criticality_class IN ('Class A (Critical)', 'Class B (Important)', 'Class C (Standard)')),
  
  -- AI-Generated Rationale
  rationale_text TEXT NOT NULL,
  oversight_level TEXT NOT NULL CHECK (oversight_level IN ('On-Site Audit', 'Paper Audit', 'Certificate Only')),
  qmsr_clause_reference TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('Approved for ASL with High Oversight', 'Approved with Standard Monitoring')),
  
  -- Audit Trail
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Approval', 'Approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_validation_rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_criticality_rationales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for process_validation_rationales
CREATE POLICY "Users can view rationales for their company"
  ON public.process_validation_rationales
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = process_validation_rationales.company_id
    )
  );

CREATE POLICY "Users can create rationales for their company"
  ON public.process_validation_rationales
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = process_validation_rationales.company_id
    )
  );

CREATE POLICY "Users can update rationales for their company"
  ON public.process_validation_rationales
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = process_validation_rationales.company_id
    )
  );

CREATE POLICY "Users can delete rationales for their company"
  ON public.process_validation_rationales
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = process_validation_rationales.company_id
    )
  );

-- RLS Policies for supplier_criticality_rationales
CREATE POLICY "Users can view supplier rationales for their company"
  ON public.supplier_criticality_rationales
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = supplier_criticality_rationales.company_id
    )
  );

CREATE POLICY "Users can create supplier rationales for their company"
  ON public.supplier_criticality_rationales
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = supplier_criticality_rationales.company_id
    )
  );

CREATE POLICY "Users can update supplier rationales for their company"
  ON public.supplier_criticality_rationales
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = supplier_criticality_rationales.company_id
    )
  );

CREATE POLICY "Users can delete supplier rationales for their company"
  ON public.supplier_criticality_rationales
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid()
      AND uca.company_id = supplier_criticality_rationales.company_id
    )
  );

-- Create indexes for performance
CREATE INDEX idx_process_validation_rationales_company ON public.process_validation_rationales(company_id);
CREATE INDEX idx_process_validation_rationales_product ON public.process_validation_rationales(product_id);
CREATE INDEX idx_process_validation_rationales_status ON public.process_validation_rationales(status);
CREATE INDEX idx_supplier_criticality_rationales_company ON public.supplier_criticality_rationales(company_id);
CREATE INDEX idx_supplier_criticality_rationales_supplier ON public.supplier_criticality_rationales(supplier_id);
CREATE INDEX idx_supplier_criticality_rationales_status ON public.supplier_criticality_rationales(status);

-- Function to generate document IDs
CREATE OR REPLACE FUNCTION generate_rbr_document_id(prefix TEXT, company_id UUID)
RETURNS TEXT AS $$
DECLARE
  counter INT;
  doc_id TEXT;
BEGIN
  IF prefix = 'RBR-ENG' THEN
    SELECT COUNT(*) + 1 INTO counter
    FROM public.process_validation_rationales
    WHERE process_validation_rationales.company_id = generate_rbr_document_id.company_id;
  ELSE
    SELECT COUNT(*) + 1 INTO counter
    FROM public.supplier_criticality_rationales
    WHERE supplier_criticality_rationales.company_id = generate_rbr_document_id.company_id;
  END IF;
  
  doc_id := prefix || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers to update updated_at
CREATE TRIGGER update_process_validation_rationales_updated_at
  BEFORE UPDATE ON public.process_validation_rationales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_criticality_rationales_updated_at
  BEFORE UPDATE ON public.supplier_criticality_rationales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();