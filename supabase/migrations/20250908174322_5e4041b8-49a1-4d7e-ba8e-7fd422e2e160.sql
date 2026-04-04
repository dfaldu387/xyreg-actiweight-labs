-- Make document-templates bucket public and fix RLS policies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'document-templates';

-- Drop existing RLS policies that might be conflicting
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Create new public access policies for document-templates bucket
CREATE POLICY "Public access to document-templates" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'document-templates');