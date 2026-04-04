-- Drop any existing storage policies with different names if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view product videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product videos" ON storage.objects;

-- Create RLS policies for product-images bucket with unique names
CREATE POLICY "product_images_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create RLS policies for product-videos bucket with unique names
CREATE POLICY "product_videos_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "product_videos_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "product_videos_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "product_videos_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');