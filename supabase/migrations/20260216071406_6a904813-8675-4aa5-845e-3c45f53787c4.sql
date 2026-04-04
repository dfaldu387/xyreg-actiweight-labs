
-- Create usability-evidence storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('usability-evidence', 'usability-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload usability evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'usability-evidence');

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view usability evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'usability-evidence');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete usability evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'usability-evidence');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update usability evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'usability-evidence');
