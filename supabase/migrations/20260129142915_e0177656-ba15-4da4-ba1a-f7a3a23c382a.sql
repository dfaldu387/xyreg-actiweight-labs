-- Create Change Control Requests table
CREATE TABLE public.change_control_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccr_id TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Source linking
  source_type TEXT NOT NULL DEFAULT 'other', -- 'capa', 'design_review', 'regulatory', 'audit', 'other'
  source_capa_id UUID REFERENCES public.capa_records(id) ON DELETE SET NULL,
  source_reference TEXT, -- For non-CAPA sources
  
  -- Change details
  change_type TEXT NOT NULL, -- 'design', 'process', 'document', 'supplier', 'software', 'labeling'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  
  -- Impact assessment
  risk_impact TEXT DEFAULT 'low', -- 'none', 'low', 'medium', 'high'
  regulatory_impact BOOLEAN DEFAULT FALSE,
  regulatory_impact_description TEXT,
  cost_impact NUMERIC,
  
  -- Affected items (stored as JSON arrays)
  affected_documents JSONB DEFAULT '[]'::jsonb,
  affected_requirements JSONB DEFAULT '[]'::jsonb,
  affected_specifications JSONB DEFAULT '[]'::jsonb,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'under_review', 'approved', 'rejected', 'implemented', 'verified', 'closed'
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Approval tracking
  technical_approved BOOLEAN DEFAULT FALSE,
  technical_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  technical_approved_at TIMESTAMPTZ,
  
  quality_approved BOOLEAN DEFAULT FALSE,
  quality_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quality_approved_at TIMESTAMPTZ,
  
  regulatory_approved BOOLEAN DEFAULT FALSE,
  regulatory_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  regulatory_approved_at TIMESTAMPTZ,
  
  -- Implementation tracking
  implementation_plan TEXT,
  implementation_notes TEXT,
  verification_plan TEXT,
  verification_evidence TEXT,
  
  -- Dates
  target_implementation_date TIMESTAMPTZ,
  implemented_date TIMESTAMPTZ,
  implemented_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_date TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_date TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Change Control State Transitions table (audit trail)
CREATE TABLE public.change_control_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccr_id UUID NOT NULL REFERENCES public.change_control_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  transition_reason TEXT,
  digital_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.change_control_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_control_state_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for change_control_requests (using user_company_access table)
CREATE POLICY "Users can view CCRs for their company"
  ON public.change_control_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create CCRs for their company"
  ON public.change_control_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update CCRs for their company"
  ON public.change_control_requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete CCRs for their company"
  ON public.change_control_requests
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for change_control_state_transitions
CREATE POLICY "Users can view CCR transitions for their company"
  ON public.change_control_state_transitions
  FOR SELECT
  TO authenticated
  USING (
    ccr_id IN (
      SELECT id FROM public.change_control_requests
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create CCR transitions for their company"
  ON public.change_control_state_transitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ccr_id IN (
      SELECT id FROM public.change_control_requests
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
      )
    )
  );

-- Create function to auto-generate CCR ID
CREATE OR REPLACE FUNCTION public.generate_ccr_id()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_ccr_id TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ccr_id FROM 'CCR-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.change_control_requests
  WHERE ccr_id LIKE 'CCR-' || year_part || '-%';
  
  new_ccr_id := 'CCR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.ccr_id := new_ccr_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating CCR ID
CREATE TRIGGER trigger_generate_ccr_id
  BEFORE INSERT ON public.change_control_requests
  FOR EACH ROW
  WHEN (NEW.ccr_id IS NULL OR NEW.ccr_id = '')
  EXECUTE FUNCTION public.generate_ccr_id();

-- Create function to update updated_at timestamp
CREATE TRIGGER update_change_control_requests_updated_at
  BEFORE UPDATE ON public.change_control_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ccr_company_id ON public.change_control_requests(company_id);
CREATE INDEX idx_ccr_product_id ON public.change_control_requests(product_id);
CREATE INDEX idx_ccr_source_capa_id ON public.change_control_requests(source_capa_id);
CREATE INDEX idx_ccr_status ON public.change_control_requests(status);
CREATE INDEX idx_ccr_created_at ON public.change_control_requests(created_at DESC);
CREATE INDEX idx_ccr_transitions_ccr_id ON public.change_control_state_transitions(ccr_id);