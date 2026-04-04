-- Create storage bucket for document templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-templates', 'document-templates', false);

-- Create RLS policies for document templates bucket
CREATE POLICY "Users can view their company's document templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload their company's document templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their company's document templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their company's document templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'document-templates' AND auth.uid() IS NOT NULL);