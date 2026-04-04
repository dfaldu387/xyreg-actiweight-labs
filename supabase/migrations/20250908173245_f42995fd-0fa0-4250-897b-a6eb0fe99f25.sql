-- First, create the document-templates bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-templates', 'document-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can upload document templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view document templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update document templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete document templates" ON storage.objects;

-- Create more permissive RLS policies for document-templates bucket
CREATE POLICY "Allow authenticated users to upload to document-templates" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'document-templates');

CREATE POLICY "Allow authenticated users to view document-templates" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'document-templates');

CREATE POLICY "Allow authenticated users to update document-templates" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'document-templates') 
WITH CHECK (bucket_id = 'document-templates');

CREATE POLICY "Allow authenticated users to delete document-templates" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'document-templates');