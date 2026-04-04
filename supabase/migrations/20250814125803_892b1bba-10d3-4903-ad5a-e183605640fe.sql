-- Add markets column to product_variants table for variant-level market targeting
ALTER TABLE product_variants 
ADD COLUMN markets jsonb DEFAULT '[]'::jsonb;

-- Add markets column to product_variant_values table for variant value-level market targeting  
ALTER TABLE product_variant_values 
ADD COLUMN markets jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance on markets queries
CREATE INDEX idx_product_variants_markets ON product_variants USING GIN(markets);
CREATE INDEX idx_product_variant_values_markets ON product_variant_values USING GIN(markets);