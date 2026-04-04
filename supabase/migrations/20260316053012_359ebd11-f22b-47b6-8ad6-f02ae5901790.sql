-- Create bom_item_documents table
CREATE TABLE public.bom_item_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_item_id uuid NOT NULL REFERENCES public.bom_items(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  document_type text NOT NULL DEFAULT 'other',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_bom_item_documents_bom_item_id ON public.bom_item_documents(bom_item_id);
CREATE INDEX idx_bom_item_documents_company_id ON public.bom_item_documents(company_id);

-- updated_at trigger
CREATE TRIGGER set_bom_item_documents_updated_at
  BEFORE UPDATE ON public.bom_item_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.bom_item_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: any user with company access
CREATE POLICY "Users can view bom item documents for accessible companies"
ON public.bom_item_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = bom_item_documents.company_id
    AND uca.user_id = auth.uid()
  )
);

-- INSERT
CREATE POLICY "Users can create bom item documents"
ON public.bom_item_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = bom_item_documents.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);

-- UPDATE
CREATE POLICY "Users can update bom item documents"
ON public.bom_item_documents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = bom_item_documents.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);

-- DELETE
CREATE POLICY "Users can delete bom item documents"
ON public.bom_item_documents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_access uca
    WHERE uca.company_id = bom_item_documents.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor', 'consultant')
  )
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bom-documents', 'bom-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone authenticated can read
CREATE POLICY "Authenticated users can read bom documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bom-documents');

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload bom documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bom-documents');

-- Storage RLS: authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete bom documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bom-documents');