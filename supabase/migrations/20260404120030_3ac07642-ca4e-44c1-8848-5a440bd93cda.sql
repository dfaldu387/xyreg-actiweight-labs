
CREATE TABLE public.product_field_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  suggested_value TEXT NOT NULL,
  current_value TEXT,
  source TEXT NOT NULL DEFAULT 'document_studio',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_field_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company suggestions"
  ON public.product_field_suggestions FOR SELECT TO authenticated
  USING (company_id IN (SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()));

CREATE POLICY "Users can insert suggestions for their company"
  ON public.product_field_suggestions FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()));

CREATE POLICY "Users can update their company suggestions"
  ON public.product_field_suggestions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()));

CREATE POLICY "Users can delete their company suggestions"
  ON public.product_field_suggestions FOR DELETE TO authenticated
  USING (company_id IN (SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()));
