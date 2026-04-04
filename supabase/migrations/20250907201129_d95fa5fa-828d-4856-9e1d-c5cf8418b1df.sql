-- Create storage buckets for product media if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for product-images bucket
CREATE POLICY "Allow authenticated users to view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create RLS policies for product-videos bucket
CREATE POLICY "Allow authenticated users to view product videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to upload product videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');