-- Fix storage buckets and ensure they exist with correct settings
-- Remove existing buckets first to recreate them properly
DELETE FROM storage.buckets WHERE id IN ('product-images', 'product-videos');

-- Create buckets with proper public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('product-images', 'product-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']), -- 50MB limit for images
  ('product-videos', 'product-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']); -- 100MB limit for videos

-- The storage.objects table already has RLS enabled and proper policies by default
-- Our custom policies should work now that the buckets are properly configured