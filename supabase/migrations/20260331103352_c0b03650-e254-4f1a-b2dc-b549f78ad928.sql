
CREATE TABLE public.technical_file_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  document_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, section_id, document_id)
);

ALTER TABLE public.technical_file_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage technical file document links for their company"
  ON public.technical_file_document_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = technical_file_document_links.product_id
        AND uca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_company_access uca ON uca.company_id = p.company_id
      WHERE p.id = technical_file_document_links.product_id
        AND uca.user_id = auth.uid()
    )
  );
