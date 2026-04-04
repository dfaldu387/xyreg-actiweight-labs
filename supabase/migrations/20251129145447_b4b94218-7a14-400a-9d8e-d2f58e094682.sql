-- Create storage bucket for company media (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-media', 'company-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for company-media bucket
-- Allow authenticated users to upload files for their company
CREATE POLICY "Allow authenticated users to upload company media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-media' 
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow authenticated users to update their company's files
CREATE POLICY "Allow authenticated users to update company media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-media'
  AND (storage.foldername(name))[1] = 'company-logos'
);

-- Allow public read access to company logos
CREATE POLICY "Allow public read access to company media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-media');