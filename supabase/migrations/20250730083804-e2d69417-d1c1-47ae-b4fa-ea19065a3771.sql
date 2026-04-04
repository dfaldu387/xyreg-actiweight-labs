-- Add key_technology_characteristics column to products table to store device classification data
ALTER TABLE public.products 
ADD COLUMN key_technology_characteristics jsonb DEFAULT '{}'::jsonb;