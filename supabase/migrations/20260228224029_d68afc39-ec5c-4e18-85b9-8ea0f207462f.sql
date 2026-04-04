
-- ============================================================
-- Production Module (ISO 13485 §7.5) — Database Schema
-- ============================================================

-- Enum: Production Order Status
CREATE TYPE public.production_order_status AS ENUM (
  'draft',
  'ready',
  'in_progress',
  'pending_review',
  'released',
  'rejected',
  'on_hold',
  'cancelled'
);

-- Enum: Batch Disposition
CREATE TYPE public.batch_disposition AS ENUM (
  'pending',
  'released',
  'rejected',
  'on_hold',
  'quarantined'
);

-- Enum: Checkpoint Result
CREATE TYPE public.checkpoint_result AS ENUM (
  'pass',
  'fail',
  'conditional',
  'na',
  'pending'
);

-- ============================================================
-- 1. Production Orders (Work Orders)
-- ============================================================
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL DEFAULT '', -- auto-generated WO-YYYY-NNN
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  
  -- Batch/Lot identification
  batch_number TEXT,
  lot_number TEXT,
  serial_number_range TEXT, -- e.g. "SN-001 to SN-050"
  
  -- Quantities
  quantity_planned INTEGER,
  quantity_produced INTEGER DEFAULT 0,
  quantity_accepted INTEGER DEFAULT 0,
  quantity_rejected INTEGER DEFAULT 0,
  
  -- Status & Disposition
  status public.production_order_status NOT NULL DEFAULT 'draft',
  disposition public.batch_disposition NOT NULL DEFAULT 'pending',
  disposition_notes TEXT,
  disposition_date TIMESTAMPTZ,
  disposition_by UUID,
  
  -- Traceability (Phase 1.5 fields)
  component_lot_numbers JSONB DEFAULT '[]'::jsonb, -- [{component, lot_number, supplier}]
  equipment_ids JSONB DEFAULT '[]'::jsonb, -- [{equipment_id, name, calibration_date}]
  operator_ids JSONB DEFAULT '[]'::jsonb, -- [{user_id, name, training_verified}]
  
  -- Scheduling
  planned_start_date TIMESTAMPTZ,
  planned_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  
  -- Links
  linked_nc_id UUID, -- auto-created NC on rejection
  
  -- DHR
  dhr_generated BOOLEAN DEFAULT false,
  dhr_generated_at TIMESTAMPTZ,
  dhr_generated_by UUID,
  
  -- Metadata
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate order_id: WO-YYYY-NNN
CREATE OR REPLACE FUNCTION public.generate_production_order_id()
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
    CAST(SUBSTRING(order_id FROM 'WO-' || year_str || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM production_orders
  WHERE order_id LIKE 'WO-' || year_str || '-%';
  
  new_id := 'WO-' || year_str || '-' || LPAD(seq_num::TEXT, 3, '0');
  NEW.order_id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_production_order_id
  BEFORE INSERT ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_production_order_id();

-- Updated_at trigger
CREATE TRIGGER update_production_orders_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. In-Process Checkpoints
-- ============================================================
CREATE TABLE public.production_checkpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  
  checkpoint_name TEXT NOT NULL,
  description TEXT,
  specification TEXT, -- expected spec
  measured_value TEXT, -- actual measurement
  unit TEXT,
  result public.checkpoint_result NOT NULL DEFAULT 'pending',
  
  -- Who/When
  inspector_id UUID,
  inspected_at TIMESTAMPTZ,
  equipment_used TEXT,
  
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_production_checkpoints_updated_at
  BEFORE UPDATE ON public.production_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. State Transitions (Audit Trail)
-- ============================================================
CREATE TABLE public.production_order_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID NOT NULL,
  transition_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Production Evidence / Attachments
-- ============================================================
CREATE TABLE public.production_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('production-evidence', 'production-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

-- production_orders
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production orders in their company"
  ON public.production_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = production_orders.company_id
    AND uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert production orders in their company"
  ON public.production_orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = production_orders.company_id
    AND uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update production orders in their company"
  ON public.production_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = production_orders.company_id
    AND uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete production orders in their company"
  ON public.production_orders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = production_orders.company_id
    AND uca.user_id = auth.uid()
  ));

-- production_checkpoints (via order_id join)
ALTER TABLE public.production_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage checkpoints via order company"
  ON public.production_checkpoints FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.production_orders po
    JOIN public.user_company_access uca ON uca.company_id = po.company_id
    WHERE po.id = production_checkpoints.order_id
    AND uca.user_id = auth.uid()
  ));

-- production_order_transitions (via order_id join)
ALTER TABLE public.production_order_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage transitions via order company"
  ON public.production_order_transitions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.production_orders po
    JOIN public.user_company_access uca ON uca.company_id = po.company_id
    WHERE po.id = production_order_transitions.order_id
    AND uca.user_id = auth.uid()
  ));

-- production_evidence (via order_id join)
ALTER TABLE public.production_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage evidence via order company"
  ON public.production_evidence FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.production_orders po
    JOIN public.user_company_access uca ON uca.company_id = po.company_id
    WHERE po.id = production_evidence.order_id
    AND uca.user_id = auth.uid()
  ));

-- Storage policies
CREATE POLICY "Users can upload production evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'production-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view production evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'production-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete production evidence"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'production-evidence' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_production_orders_company ON public.production_orders(company_id);
CREATE INDEX idx_production_orders_product ON public.production_orders(product_id);
CREATE INDEX idx_production_checkpoints_order ON public.production_checkpoints(order_id);
CREATE INDEX idx_production_transitions_order ON public.production_order_transitions(order_id);
CREATE INDEX idx_production_evidence_order ON public.production_evidence(order_id);
