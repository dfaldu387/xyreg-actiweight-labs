-- Add support for multiple FDA product codes in products table
ALTER TABLE products 
ADD COLUMN fda_product_codes JSONB DEFAULT '[]'::JSONB;