-- Add variant_tags column to products for product-level variant attributes
ALTER TABLE products 
ADD COLUMN variant_tags JSONB DEFAULT NULL;

-- Add product_family_placeholder for pre-UDI products during development
ALTER TABLE products 
ADD COLUMN product_family_placeholder VARCHAR(100) DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX idx_products_variant_tags ON products USING GIN (variant_tags);
CREATE INDEX idx_products_family_placeholder ON products (product_family_placeholder);

-- Add comments for documentation
COMMENT ON COLUMN products.variant_tags IS 
'Variant attributes for this product within its family. Example: {"Size": "Medium", "Quantity per set": "20"}';

COMMENT ON COLUMN products.product_family_placeholder IS 
'Temporary family identifier for products without Basic UDI-DI yet (during development/feasibility)';

-- Fix the broken display flag for the "(10)" product
UPDATE products 
SET display_as_variant_group = false, 
    variant_group_summary = NULL 
WHERE id = '710f8652-a1ee-4510-b2fd-65d6816e412c';