-- Create storage policies for document-templates bucket

-- Allow authenticated users to view/download document templates  
CREATE POLICY "Authenticated users can view document templates" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'document-templates' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload document templates
CREATE POLICY "Authenticated users can upload document templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'document-templates' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update document templates
CREATE POLICY "Authenticated users can update document templates" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'document-templates' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete document templates
CREATE POLICY "Authenticated users can delete document templates" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'document-templates' 
  AND auth.role() = 'authenticated'
);