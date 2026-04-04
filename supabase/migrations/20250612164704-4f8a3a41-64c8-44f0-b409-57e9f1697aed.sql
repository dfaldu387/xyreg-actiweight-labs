
-- Clean up and standardize storage policies for document-files bucket
-- This fixes the 403 upload errors by removing conflicting policies

-- First, drop all existing policies for the document-files bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create standardized policies using consistent authentication checks
CREATE POLICY "Document files - INSERT" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'document-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Document files - SELECT" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'document-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Document files - UPDATE" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'document-files' AND
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'document-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Document files - DELETE" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'document-files' AND
    auth.uid() IS NOT NULL
  );

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-files', 
  'document-files', 
  false, 
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
