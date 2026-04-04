-- Create storage bucket for material certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('material-certificates', 'material-certificates', false);

-- Create RLS policies for material certificates
CREATE POLICY "Users can view material certificates they have access to" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'material-certificates');

CREATE POLICY "Users can upload material certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'material-certificates');

CREATE POLICY "Users can update their material certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'material-certificates');

CREATE POLICY "Users can delete material certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'material-certificates');