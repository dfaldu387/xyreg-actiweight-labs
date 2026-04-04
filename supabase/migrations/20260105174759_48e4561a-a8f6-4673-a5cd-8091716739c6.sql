-- Add homepage_url column to product_manual_competitors
ALTER TABLE public.product_manual_competitors
ADD COLUMN homepage_url text;