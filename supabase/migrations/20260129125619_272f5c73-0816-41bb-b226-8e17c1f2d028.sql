-- =============================================
-- CAPA MODULE DATABASE SCHEMA
-- =============================================

-- =============================================
-- 1. CAPA RECORDS (Core Table)
-- =============================================

CREATE TABLE public.capa_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id VARCHAR(20) NOT NULL UNIQUE, -- Auto-generated: CAPA-2026-001
  
  -- Ownership
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Source Tracking (The Helix Link)
  source_type VARCHAR(50) NOT NULL, -- 'complaint', 'audit', 'ncr', 'pms_event', 'defect', 'internal', 'supplier'
  source_id UUID, -- Links to pms_events.id, audit_findings.id, defects.id, etc.
  
  -- CAPA Classification
  capa_type VARCHAR(20) NOT NULL CHECK (capa_type IN ('correction', 'corrective', 'preventive', 'both')),
  
  -- Problem Definition
  problem_description TEXT NOT NULL,
  immediate_correction TEXT,
  
  -- Risk Assessment
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  probability INTEGER CHECK (probability BETWEEN 1 AND 5),
  
  -- State Machine
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'triage', 'investigation', 'planning', 'implementation', 'verification', 'closed', 'rejected')),
  
  -- Workflow Fields
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quality_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  technical_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Investigation
  investigation_team JSONB DEFAULT '[]'::jsonb,
  rca_methodology VARCHAR(50) CHECK (rca_methodology IS NULL OR rca_methodology IN ('5_whys', 'fishbone', 'fta', 'pareto', 'other')),
  root_cause_summary TEXT,
  root_cause_category VARCHAR(50) CHECK (root_cause_category IS NULL OR root_cause_category IN ('process', 'human_error', 'material', 'design', 'equipment', 'environment')),
  
  -- Regulatory Impact (Helix Sync)
  requires_regulatory_update BOOLEAN DEFAULT false,
  regulatory_impact_description TEXT,
  affected_documents JSONB DEFAULT '[]'::jsonb,
  affected_requirements JSONB DEFAULT '[]'::jsonb,
  
  -- Verification of Effectiveness (VoE)
  voe_plan TEXT,
  voe_success_criteria TEXT,
  voe_result VARCHAR(20) CHECK (voe_result IS NULL OR voe_result IN ('pending', 'pass', 'fail')),
  voe_evidence_ids JSONB DEFAULT '[]'::jsonb,
  voe_completion_date TIMESTAMP WITH TIME ZONE,
  voe_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Closure
  closure_date TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closure_comments TEXT,
  
  -- Approval tracking
  technical_approved BOOLEAN DEFAULT false,
  technical_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  technical_approved_at TIMESTAMP WITH TIME ZONE,
  
  quality_approved BOOLEAN DEFAULT false,
  quality_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quality_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Due Dates
  target_investigation_date DATE,
  target_implementation_date DATE,
  target_verification_date DATE,
  target_closure_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_capa_company ON public.capa_records(company_id);
CREATE INDEX idx_capa_product ON public.capa_records(product_id);
CREATE INDEX idx_capa_status ON public.capa_records(status);
CREATE INDEX idx_capa_source ON public.capa_records(source_type, source_id);
CREATE INDEX idx_capa_owner ON public.capa_records(owner_id);
CREATE INDEX idx_capa_created_at ON public.capa_records(created_at DESC);

-- =============================================
-- 2. CAPA ACTIONS TABLE
-- =============================================

CREATE TABLE public.capa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id UUID REFERENCES public.capa_records(id) ON DELETE CASCADE NOT NULL,
  
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('correction', 'corrective', 'preventive')),
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  completion_evidence TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_capa_actions_capa ON public.capa_actions(capa_id);
CREATE INDEX idx_capa_actions_assigned ON public.capa_actions(assigned_to);
CREATE INDEX idx_capa_actions_status ON public.capa_actions(status);

-- =============================================
-- 3. CAPA EVIDENCE TABLE
-- =============================================

CREATE TABLE public.capa_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id UUID REFERENCES public.capa_records(id) ON DELETE CASCADE NOT NULL,
  
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('rca', 'action_completion', 'voe', 'other')),
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_capa_evidence_capa ON public.capa_evidence(capa_id);
CREATE INDEX idx_capa_evidence_type ON public.capa_evidence(evidence_type);

-- =============================================
-- 4. CAPA STATE TRANSITIONS (Audit Trail)
-- =============================================

CREATE TABLE public.capa_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id UUID REFERENCES public.capa_records(id) ON DELETE CASCADE NOT NULL,
  
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  transitioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  transition_reason TEXT,
  digital_signature TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_capa_transitions_capa ON public.capa_state_transitions(capa_id);
CREATE INDEX idx_capa_transitions_created ON public.capa_state_transitions(created_at DESC);

-- =============================================
-- 5. AUTO-GENERATE CAPA ID FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_capa_id()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  next_seq INTEGER;
  new_capa_id TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(capa_id, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM public.capa_records
  WHERE capa_id LIKE 'CAPA-' || year_part || '-%';
  
  new_capa_id := 'CAPA-' || year_part || '-' || LPAD(next_seq::TEXT, 3, '0');
  NEW.capa_id := new_capa_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_generate_capa_id
BEFORE INSERT ON public.capa_records
FOR EACH ROW
WHEN (NEW.capa_id IS NULL OR NEW.capa_id = '')
EXECUTE FUNCTION public.generate_capa_id();

-- =============================================
-- 6. UPDATE TIMESTAMP TRIGGER
-- =============================================

CREATE TRIGGER update_capa_records_updated_at
BEFORE UPDATE ON public.capa_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capa_actions_updated_at
BEFORE UPDATE ON public.capa_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.capa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_state_transitions ENABLE ROW LEVEL SECURITY;

-- CAPA Records: Users can view CAPAs for their company
CREATE POLICY "Users can view company CAPAs"
ON public.capa_records
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- CAPA Records: Users can create CAPAs for their company
CREATE POLICY "Users can create CAPAs for their company"
ON public.capa_records
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- CAPA Records: Owners, quality leads, and admins can update
CREATE POLICY "CAPA owners and leads can update"
ON public.capa_records
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() OR 
  quality_lead_id = auth.uid() OR
  technical_lead_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = capa_records.company_id
    AND access_level IN ('admin', 'editor')
  )
);

-- CAPA Records: Only admins can delete
CREATE POLICY "Only admins can delete CAPAs"
ON public.capa_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = capa_records.company_id
    AND access_level = 'admin'
  )
);

-- CAPA Actions: Same access as parent CAPA record
CREATE POLICY "Users can view CAPA actions"
ON public.capa_actions
FOR SELECT
TO authenticated
USING (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create CAPA actions"
ON public.capa_actions
FOR INSERT
TO authenticated
WITH CHECK (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Assigned users and leads can update actions"
ON public.capa_actions
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid() OR
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE owner_id = auth.uid() OR quality_lead_id = auth.uid() OR technical_lead_id = auth.uid()
  )
);

CREATE POLICY "CAPA leads can delete actions"
ON public.capa_actions
FOR DELETE
TO authenticated
USING (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE owner_id = auth.uid() OR quality_lead_id = auth.uid()
  )
);

-- CAPA Evidence: Same access as parent CAPA record
CREATE POLICY "Users can view CAPA evidence"
ON public.capa_evidence
FOR SELECT
TO authenticated
USING (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload CAPA evidence"
ON public.capa_evidence
FOR INSERT
TO authenticated
WITH CHECK (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Uploaders can delete their evidence"
ON public.capa_evidence
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid() OR
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE owner_id = auth.uid() OR quality_lead_id = auth.uid()
  )
);

-- CAPA State Transitions: Same access as parent CAPA record
CREATE POLICY "Users can view CAPA transitions"
ON public.capa_state_transitions
FOR SELECT
TO authenticated
USING (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Authorized users can create transitions"
ON public.capa_state_transitions
FOR INSERT
TO authenticated
WITH CHECK (
  capa_id IN (
    SELECT id FROM public.capa_records
    WHERE owner_id = auth.uid() OR quality_lead_id = auth.uid() OR technical_lead_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM public.user_company_access 
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  )
);