-- Create storage bucket for supplier evaluation documents
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-documents', 'supplier-documents', false);

-- Create RLS policies for supplier documents bucket
CREATE POLICY "Users can view supplier documents for their companies"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'supplier-documents' AND
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND (storage.foldername(name))[1] = uca.company_id::text
  )
);

CREATE POLICY "Users can upload supplier documents for their companies"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-documents' AND
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
    AND (storage.foldername(name))[1] = uca.company_id::text
  )
);

CREATE POLICY "Users can update supplier documents for their companies"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'supplier-documents' AND
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
    AND (storage.foldername(name))[1] = uca.company_id::text
  )
);

CREATE POLICY "Users can delete supplier documents for their companies"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'supplier-documents' AND
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
    AND (storage.foldername(name))[1] = uca.company_id::text
  )
);