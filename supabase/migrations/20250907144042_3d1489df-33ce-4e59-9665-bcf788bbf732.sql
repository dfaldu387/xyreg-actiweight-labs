-- Create the documents storage bucket for activity template files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create RLS policy for documents bucket - users can access files from their company
CREATE POLICY "Users can view company documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[2] IN (
    SELECT user_metadata->>'activeCompany' 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Users can upload documents to their company folder
CREATE POLICY "Users can upload company documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[2] = (
    SELECT user_metadata->>'activeCompany' 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Users can update their company documents
CREATE POLICY "Users can update company documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[2] IN (
    SELECT user_metadata->>'activeCompany' 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);

-- Users can delete their company documents
CREATE POLICY "Users can delete company documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[2] IN (
    SELECT user_metadata->>'activeCompany' 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);