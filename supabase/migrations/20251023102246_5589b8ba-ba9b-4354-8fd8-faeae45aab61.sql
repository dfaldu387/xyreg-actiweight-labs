-- Add variant grouping fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_as_variant_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS variant_group_summary jsonb;

-- Create index for faster queries on variant groups
CREATE INDEX IF NOT EXISTS idx_products_variant_group 
ON products(display_as_variant_group) 
WHERE display_as_variant_group = true;

-- Add comment for documentation
COMMENT ON COLUMN products.display_as_variant_group IS 'When true, this product displays as a grouped variant card with stacked visual effect';
COMMENT ON COLUMN products.variant_group_summary IS 'Cached summary of variant dimensions for quick display, e.g. {"Size": {"count": 5, "values": ["XL", "L", "M", "S", "P"]}, "Color": {"count": 1, "value": "Blue"}}';