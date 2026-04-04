-- Check and create all necessary storage buckets for document uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('document-templates', 'document-templates', false),
  ('documents', 'documents', false),
  ('ci-documents', 'ci-documents', false),
  ('company-documents', 'company-documents', false),
  ('product-documents', 'product-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing conflicting policies first
DROP POLICY IF EXISTS "Allow authenticated users to upload to document-templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view document-templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update document-templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete document-templates" ON storage.objects;

-- Create comprehensive RLS policies for all document storage buckets
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('document-templates', 'documents', 'ci-documents', 'company-documents', 'product-documents'));

CREATE POLICY "Authenticated users can view documents" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id IN ('document-templates', 'documents', 'ci-documents', 'company-documents', 'product-documents'));

CREATE POLICY "Authenticated users can update documents" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id IN ('document-templates', 'documents', 'ci-documents', 'company-documents', 'product-documents')) 
WITH CHECK (bucket_id IN ('document-templates', 'documents', 'ci-documents', 'company-documents', 'product-documents'));

CREATE POLICY "Authenticated users can delete documents" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id IN ('document-templates', 'documents', 'ci-documents', 'company-documents', 'product-documents'));