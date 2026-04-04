
-- =============================================
-- L2 Nonconformity (NC) Module - ISO 13485 Clause 8.3
-- =============================================

-- Auto-generate NC IDs
CREATE OR REPLACE FUNCTION public.generate_nc_id()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  next_seq INT;
BEGIN
  year_str := to_char(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(nc_id, '-', 3) AS INT)
  ), 0) + 1
  INTO next_seq
  FROM public.nonconformity_records
  WHERE nc_id LIKE 'NC-' || year_str || '-%';
  
  NEW.nc_id := 'NC-' || year_str || '-' || LPAD(next_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Main NC records table
CREATE TABLE public.nonconformity_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nc_id VARCHAR NOT NULL DEFAULT '',
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NULL REFERENCES public.products(id),
  source_type VARCHAR NOT NULL DEFAULT 'internal',
  source_id UUID NULL,
  title TEXT NOT NULL,
  description_is TEXT NOT NULL DEFAULT '',
  description_should_be TEXT NOT NULL DEFAULT '',
  status VARCHAR NOT NULL DEFAULT 'open',
  disposition VARCHAR NULL,
  disposition_justification TEXT NULL,
  severity VARCHAR NULL,
  batch_lot_number TEXT NULL,
  serial_number TEXT NULL,
  affected_field_ids JSONB DEFAULT '[]',
  affected_requirement_ids JSONB DEFAULT '[]',
  rca_methodology VARCHAR NULL,
  rca_methodologies TEXT[] NULL,
  rca_data JSONB NULL,
  root_cause_summary TEXT NULL,
  root_cause_category VARCHAR NULL,
  linked_capa_id UUID NULL REFERENCES public.capa_records(id),
  linked_ccr_id UUID NULL REFERENCES public.change_control_requests(id),
  owner_id UUID NULL REFERENCES public.profiles(id),
  quality_approved_by UUID NULL REFERENCES public.profiles(id),
  quality_approved_at TIMESTAMPTZ NULL,
  target_disposition_date TIMESTAMPTZ NULL,
  target_verification_date TIMESTAMPTZ NULL,
  target_closure_date TIMESTAMPTZ NULL,
  closed_by UUID NULL REFERENCES public.profiles(id),
  closure_date TIMESTAMPTZ NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for auto-generating NC IDs
CREATE TRIGGER generate_nc_id_trigger
  BEFORE INSERT ON public.nonconformity_records
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_nc_id();

-- Updated_at trigger
CREATE TRIGGER update_nonconformity_records_updated_at
  BEFORE UPDATE ON public.nonconformity_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- NC State Transitions (audit trail)
CREATE TABLE public.nc_state_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nc_id UUID NOT NULL REFERENCES public.nonconformity_records(id) ON DELETE CASCADE,
  from_status VARCHAR NULL,
  to_status VARCHAR NOT NULL,
  transitioned_by UUID NOT NULL REFERENCES public.profiles(id),
  transition_reason TEXT NULL,
  digital_signature VARCHAR NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NC Evidence
CREATE TABLE public.nc_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nc_id UUID NOT NULL REFERENCES public.nonconformity_records(id) ON DELETE CASCADE,
  evidence_type VARCHAR NOT NULL DEFAULT 'other',
  file_name VARCHAR NOT NULL,
  storage_path VARCHAR NOT NULL,
  description TEXT NULL,
  uploaded_by UUID NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_nc_records_company ON public.nonconformity_records(company_id);
CREATE INDEX idx_nc_records_product ON public.nonconformity_records(product_id);
CREATE INDEX idx_nc_records_status ON public.nonconformity_records(status);
CREATE INDEX idx_nc_records_nc_id ON public.nonconformity_records(nc_id);
CREATE INDEX idx_nc_transitions_nc_id ON public.nc_state_transitions(nc_id);
CREATE INDEX idx_nc_evidence_nc_id ON public.nc_evidence(nc_id);

-- RLS
ALTER TABLE public.nonconformity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nc_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nc_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nonconformity_records
CREATE POLICY "Users can view NCs in their company"
  ON public.nonconformity_records FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can create NCs in their company"
  ON public.nonconformity_records FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update NCs in their company"
  ON public.nonconformity_records FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete NCs in their company"
  ON public.nonconformity_records FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- RLS Policies for nc_state_transitions
CREATE POLICY "Users can view NC transitions in their company"
  ON public.nc_state_transitions FOR SELECT
  USING (nc_id IN (
    SELECT nr.id FROM public.nonconformity_records nr
    WHERE nr.company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create NC transitions"
  ON public.nc_state_transitions FOR INSERT
  WITH CHECK (nc_id IN (
    SELECT nr.id FROM public.nonconformity_records nr
    WHERE nr.company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- RLS Policies for nc_evidence
CREATE POLICY "Users can view NC evidence in their company"
  ON public.nc_evidence FOR SELECT
  USING (nc_id IN (
    SELECT nr.id FROM public.nonconformity_records nr
    WHERE nr.company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage NC evidence in their company"
  ON public.nc_evidence FOR INSERT
  WITH CHECK (nc_id IN (
    SELECT nr.id FROM public.nonconformity_records nr
    WHERE nr.company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete NC evidence in their company"
  ON public.nc_evidence FOR DELETE
  USING (nc_id IN (
    SELECT nr.id FROM public.nonconformity_records nr
    WHERE nr.company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- Storage bucket for NC evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('nc-evidence', 'nc-evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload NC evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'nc-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view NC evidence files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nc-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete NC evidence files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'nc-evidence' AND auth.uid() IS NOT NULL);
