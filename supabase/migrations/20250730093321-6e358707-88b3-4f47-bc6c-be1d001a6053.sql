-- Add primary_regulatory_type column to products table
ALTER TABLE public.products 
ADD COLUMN primary_regulatory_type TEXT;