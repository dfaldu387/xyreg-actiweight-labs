
CREATE TABLE public.field_governance_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'approved_with_conditions', 'rejected', 'modified')),
  design_review_id UUID REFERENCES public.design_reviews(id) ON DELETE SET NULL,
  verdict_comment TEXT,
  snapshot_hash TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, section_key)
);

ALTER TABLE public.field_governance_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance status for their company products"
  ON public.field_governance_status FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = field_governance_status.product_id AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert governance status for their company products"
  ON public.field_governance_status FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = field_governance_status.product_id AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update governance status for their company products"
  ON public.field_governance_status FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = field_governance_status.product_id AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete governance status for their company products"
  ON public.field_governance_status FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = field_governance_status.product_id AND uca.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_field_governance_status_updated_at
  BEFORE UPDATE ON public.field_governance_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_field_governance_status_product ON public.field_governance_status(product_id);
