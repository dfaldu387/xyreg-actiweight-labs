-- Add description field to product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS description TEXT;

