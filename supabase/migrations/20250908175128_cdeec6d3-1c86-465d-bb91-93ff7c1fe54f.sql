-- Fix RLS policies for document-templates bucket

-- First ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-templates', 'document-templates', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Drop any conflicting policies that might prevent access
DROP POLICY IF EXISTS "Public access to document-templates" ON storage.objects;

-- Create comprehensive RLS policies for document-templates bucket
CREATE POLICY "Document templates - SELECT" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'document-templates');

CREATE POLICY "Document templates - INSERT" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'document-templates');

CREATE POLICY "Document templates - UPDATE" 
ON storage.objects 
FOR UPDATE 
TO public 
USING (bucket_id = 'document-templates')
WITH CHECK (bucket_id = 'document-templates');

CREATE POLICY "Document templates - DELETE" 
ON storage.objects 
FOR DELETE 
TO public 
USING (bucket_id = 'document-templates');