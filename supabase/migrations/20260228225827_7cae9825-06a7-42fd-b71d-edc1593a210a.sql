
-- BOM revision status enum
CREATE TYPE public.bom_revision_status AS ENUM ('draft', 'active', 'obsolete');

-- BOM Revisions table
CREATE TABLE public.bom_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  revision TEXT NOT NULL DEFAULT 'A',
  status public.bom_revision_status NOT NULL DEFAULT 'draft',
  description TEXT,
  total_cost NUMERIC(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOM Items table
CREATE TABLE public.bom_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bom_revision_id UUID NOT NULL REFERENCES public.bom_revisions(id) ON DELETE CASCADE,
  component_id TEXT,
  material_id TEXT,
  item_number TEXT NOT NULL DEFAULT '1.0',
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_of_measure TEXT NOT NULL DEFAULT 'ea',
  unit_cost NUMERIC(12,4) DEFAULT 0,
  extended_cost NUMERIC(14,4) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_part_number TEXT,
  lead_time_days INTEGER,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOM Revision Transitions (audit trail)
CREATE TABLE public.bom_revision_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bom_revision_id UUID NOT NULL REFERENCES public.bom_revisions(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transitioned_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bom_revisions_product ON public.bom_revisions(product_id);
CREATE INDEX idx_bom_revisions_company ON public.bom_revisions(company_id);
CREATE INDEX idx_bom_items_revision ON public.bom_items(bom_revision_id);
CREATE INDEX idx_bom_transitions_revision ON public.bom_revision_transitions(bom_revision_id);

-- RLS
ALTER TABLE public.bom_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_revision_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bom_revisions
CREATE POLICY "Users can view BOM revisions for their company"
  ON public.bom_revisions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can create BOM revisions for their company"
  ON public.bom_revisions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can update BOM revisions for their company"
  ON public.bom_revisions FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete BOM revisions for their company"
  ON public.bom_revisions FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));

-- RLS Policies for bom_items (via revision join)
CREATE POLICY "Users can view BOM items"
  ON public.bom_items FOR SELECT
  USING (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create BOM items"
  ON public.bom_items FOR INSERT
  WITH CHECK (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update BOM items"
  ON public.bom_items FOR UPDATE
  USING (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete BOM items"
  ON public.bom_items FOR DELETE
  USING (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for bom_revision_transitions (via revision join)
CREATE POLICY "Users can view BOM transitions"
  ON public.bom_revision_transitions FOR SELECT
  USING (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create BOM transitions"
  ON public.bom_revision_transitions FOR INSERT
  WITH CHECK (bom_revision_id IN (
    SELECT id FROM public.bom_revisions WHERE company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  ));

-- Updated_at triggers
CREATE TRIGGER update_bom_revisions_updated_at
  BEFORE UPDATE ON public.bom_revisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bom_items_updated_at
  BEFORE UPDATE ON public.bom_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
