
CREATE TABLE public.product_market_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  market_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  certificate_number TEXT,
  approval_date DATE,
  certificate_file_path TEXT,
  certificate_file_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, market_code)
);

ALTER TABLE public.product_market_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage market approvals for their company"
  ON public.product_market_approvals FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()));
