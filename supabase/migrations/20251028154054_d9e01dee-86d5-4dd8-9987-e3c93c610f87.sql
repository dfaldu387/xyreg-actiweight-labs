-- Add definition fields to company_product_models table for shared data
ALTER TABLE company_product_models 
ADD COLUMN IF NOT EXISTS intended_use TEXT,
ADD COLUMN IF NOT EXISTS intended_purpose_data JSONB,
ADD COLUMN IF NOT EXISTS intended_users JSONB,
ADD COLUMN IF NOT EXISTS mode_of_action TEXT,
ADD COLUMN IF NOT EXISTS contraindications TEXT[],
ADD COLUMN IF NOT EXISTS warnings TEXT,
ADD COLUMN IF NOT EXISTS precautions TEXT;

-- Add override tracking to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_definition_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS definition_override_reason TEXT;

-- Add helpful comment
COMMENT ON COLUMN company_product_models.intended_use IS 'Shared intended use for all variants in this model';
COMMENT ON COLUMN products.has_definition_override IS 'Whether this variant has custom definition data instead of inheriting from model';
COMMENT ON COLUMN products.definition_override_reason IS 'Required explanation when has_definition_override is true (e.g., "Pediatric version has age restrictions")';
