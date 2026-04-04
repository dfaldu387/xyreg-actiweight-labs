
-- Table for linking variant products to master device documents (pointer system)
CREATE TABLE public.variant_document_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  master_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  is_overridden BOOLEAN NOT NULL DEFAULT false,
  override_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(variant_product_id, master_document_id)
);

-- Enable RLS
ALTER TABLE public.variant_document_links ENABLE ROW LEVEL SECURITY;

-- RLS policies via user_company_access
CREATE POLICY "Users can view variant document links"
ON public.variant_document_links FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = variant_product_id AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage variant document links"
ON public.variant_document_links FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = variant_product_id AND uca.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_variant_doc_links_variant ON public.variant_document_links(variant_product_id);
CREATE INDEX idx_variant_doc_links_master_doc ON public.variant_document_links(master_document_id);

-- updated_at trigger
CREATE TRIGGER update_variant_document_links_updated_at
BEFORE UPDATE ON public.variant_document_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
