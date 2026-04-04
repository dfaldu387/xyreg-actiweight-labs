
-- ============================================================
-- Incoming Inspection Module (ISO 13485 §7.4.3)
-- ============================================================

-- Inspection disposition enum
CREATE TYPE public.inspection_disposition AS ENUM ('pending', 'accepted', 'rejected', 'conditional_accept');

-- Inspection status state machine
CREATE TYPE public.inspection_status AS ENUM ('draft', 'in_progress', 'disposition', 'closed');

-- Sampling plan type
CREATE TYPE public.sampling_plan_type AS ENUM ('100_percent', 'aql_based', 'skip_lot');

-- ============================================================
-- 1. Main incoming_inspection_records table
-- ============================================================
CREATE TABLE public.incoming_inspection_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,

  -- Shipment info
  purchase_order_number TEXT,
  lot_batch_number TEXT,
  quantity_received INTEGER,
  received_date DATE DEFAULT CURRENT_DATE,

  -- Inspection details
  sampling_plan public.sampling_plan_type DEFAULT '100_percent',
  aql_level TEXT,
  sample_size INTEGER,
  inspection_criteria TEXT,

  -- Results
  status public.inspection_status NOT NULL DEFAULT 'draft',
  disposition public.inspection_disposition NOT NULL DEFAULT 'pending',
  disposition_reason TEXT,
  disposition_date TIMESTAMPTZ,
  disposition_by UUID REFERENCES auth.users(id),

  -- CoC tracking
  coc_received BOOLEAN DEFAULT false,
  coc_reference TEXT,

  -- NC link (auto-created on reject)
  nc_id UUID,

  -- Ownership
  inspector_id UUID REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate inspection_id: INS-YYYY-NNN
CREATE OR REPLACE FUNCTION public.generate_inspection_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  new_id TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(inspection_id FROM 'INS-' || year_str || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM incoming_inspection_records
  WHERE inspection_id LIKE 'INS-' || year_str || '-%';
  
  new_id := 'INS-' || year_str || '-' || LPAD(seq_num::TEXT, 3, '0');
  NEW.inspection_id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_inspection_id
  BEFORE INSERT ON public.incoming_inspection_records
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_inspection_id();

-- Updated_at trigger
CREATE TRIGGER update_incoming_inspection_updated_at
  BEFORE UPDATE ON public.incoming_inspection_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Inspection line items (individual checks per item/spec)
-- ============================================================
CREATE TABLE public.incoming_inspection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.incoming_inspection_records(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  measured_value TEXT,
  unit_of_measure TEXT,
  pass BOOLEAN,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. State transitions (audit trail)
-- ============================================================
CREATE TABLE public.incoming_inspection_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.incoming_inspection_records(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID NOT NULL REFERENCES auth.users(id),
  transition_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Evidence / attachments
-- ============================================================
CREATE TABLE public.incoming_inspection_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.incoming_inspection_records(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'document',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX idx_inspection_company ON public.incoming_inspection_records(company_id);
CREATE INDEX idx_inspection_supplier ON public.incoming_inspection_records(supplier_id);
CREATE INDEX idx_inspection_product ON public.incoming_inspection_records(product_id);
CREATE INDEX idx_inspection_status ON public.incoming_inspection_records(status);
CREATE INDEX idx_inspection_items_inspection ON public.incoming_inspection_items(inspection_id);
CREATE INDEX idx_inspection_transitions_inspection ON public.incoming_inspection_transitions(inspection_id);
CREATE INDEX idx_inspection_evidence_inspection ON public.incoming_inspection_evidence(inspection_id);

-- ============================================================
-- 6. RLS Policies
-- ============================================================
ALTER TABLE public.incoming_inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_inspection_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_inspection_evidence ENABLE ROW LEVEL SECURITY;

-- Records: company members can CRUD
CREATE POLICY "Company members can view inspections"
  ON public.incoming_inspection_records FOR SELECT
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Company members can create inspections"
  ON public.incoming_inspection_records FOR INSERT
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Company members can update inspections"
  ON public.incoming_inspection_records FOR UPDATE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Company members can delete inspections"
  ON public.incoming_inspection_records FOR DELETE
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

-- Items: access via parent inspection
CREATE POLICY "Access inspection items via parent"
  ON public.incoming_inspection_items FOR ALL
  USING (inspection_id IN (
    SELECT id FROM public.incoming_inspection_records WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- Transitions: access via parent inspection
CREATE POLICY "Access inspection transitions via parent"
  ON public.incoming_inspection_transitions FOR ALL
  USING (inspection_id IN (
    SELECT id FROM public.incoming_inspection_records WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- Evidence: access via parent inspection
CREATE POLICY "Access inspection evidence via parent"
  ON public.incoming_inspection_evidence FOR ALL
  USING (inspection_id IN (
    SELECT id FROM public.incoming_inspection_records WHERE company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 7. Storage bucket for inspection evidence
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-evidence', 'inspection-evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Inspection evidence upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspection-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Inspection evidence read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Inspection evidence delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'inspection-evidence' AND auth.uid() IS NOT NULL);
