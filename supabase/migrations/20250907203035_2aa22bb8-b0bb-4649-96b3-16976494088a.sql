-- Update existing buckets to ensure they are public
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'product-images';

UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'product-videos';

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
SELECT 'product-images', 'product-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
SELECT 'product-videos', 'product-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-videos');