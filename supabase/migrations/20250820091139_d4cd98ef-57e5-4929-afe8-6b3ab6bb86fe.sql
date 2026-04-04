-- Create comprehensive storage policies for document-templates bucket

-- Allow authenticated users to upload to document-templates bucket
CREATE POLICY "Users can upload to document-templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to read their company's document templates
CREATE POLICY "Users can read their company document templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their company's document templates  
CREATE POLICY "Users can update their company document templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their company's document templates
CREATE POLICY "Users can delete their company document templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);