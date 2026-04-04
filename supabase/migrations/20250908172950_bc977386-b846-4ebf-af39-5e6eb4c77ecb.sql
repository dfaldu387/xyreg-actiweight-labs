-- Create RLS policies for document-templates storage bucket
-- Allow authenticated users to upload files to document-templates bucket
CREATE POLICY "Authenticated users can upload document templates" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to view document templates
CREATE POLICY "Authenticated users can view document templates" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update document templates
CREATE POLICY "Authenticated users can update document templates" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL) 
WITH CHECK (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete document templates
CREATE POLICY "Authenticated users can delete document templates" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);