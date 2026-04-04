
-- Hazard Product Scope: tracks which products/categories a hazard applies to
CREATE TABLE public.hazard_product_scope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_id uuid NOT NULL REFERENCES public.hazards(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('device', 'category')),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_name text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT scope_device_or_category CHECK (
    (scope_type = 'device' AND product_id IS NOT NULL) OR
    (scope_type = 'category' AND category_name IS NOT NULL)
  )
);

-- Index for fast lookups
CREATE INDEX idx_hazard_product_scope_hazard ON public.hazard_product_scope(hazard_id);
CREATE INDEX idx_hazard_product_scope_product ON public.hazard_product_scope(product_id);
CREATE INDEX idx_hazard_product_scope_company ON public.hazard_product_scope(company_id);

-- RLS
ALTER TABLE public.hazard_product_scope ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hazard scopes for their company"
  ON public.hazard_product_scope FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert hazard scopes for their company"
  ON public.hazard_product_scope FOR INSERT TO authenticated
  WITH CHECK (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can update hazard scopes for their company"
  ON public.hazard_product_scope FOR UPDATE TO authenticated
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete hazard scopes for their company"
  ON public.hazard_product_scope FOR DELETE TO authenticated
  USING (company_id IN (
    SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
  ));
