-- Create RLS policies for material certificates bucket
CREATE POLICY "Allow authenticated users to view material certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'material-certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload material certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'material-certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their material certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'material-certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their material certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'material-certificates' AND auth.role() = 'authenticated');