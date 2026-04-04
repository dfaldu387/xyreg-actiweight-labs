
-- Add product_platform column to products table
ALTER TABLE products 
ADD COLUMN product_platform TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN products.product_platform IS 'Platform name that groups related products together. Used for line extensions and product families.';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_product_platform ON products(product_platform);
