-- Add Master Product support to products table
-- This allows one product in a family to be designated as the "master" template
-- that other variant products can inherit from

-- Add is_master_product flag
ALTER TABLE products 
ADD COLUMN is_master_product BOOLEAN DEFAULT false;

-- Add reference to master product for variants
ALTER TABLE products 
ADD COLUMN master_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Add field_overrides to track which fields are custom vs inherited
ALTER TABLE products 
ADD COLUMN field_overrides JSONB DEFAULT '{}'::jsonb;

-- Create index for faster master product lookups
CREATE INDEX idx_products_master_product_id ON products(master_product_id) WHERE master_product_id IS NOT NULL;

-- Create index for finding master products
CREATE INDEX idx_products_is_master ON products(is_master_product) WHERE is_master_product = true;

-- Add comment explaining the master product pattern
COMMENT ON COLUMN products.is_master_product IS 'True if this product is a master template for a product family';
COMMENT ON COLUMN products.master_product_id IS 'Reference to the master product this variant inherits from';
COMMENT ON COLUMN products.field_overrides IS 'JSON object tracking which fields have custom values instead of inheriting from master';