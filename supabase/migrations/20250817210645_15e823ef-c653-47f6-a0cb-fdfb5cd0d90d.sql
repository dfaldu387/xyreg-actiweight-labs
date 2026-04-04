-- Enable RLS on hierarchical bulk management tables
-- These tables have policies but RLS was not enabled, causing data access issues

-- Enable RLS on company device categories table
ALTER TABLE company_device_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on company platforms table  
ALTER TABLE company_platforms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on company product models table
ALTER TABLE company_product_models ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variants table (used by hierarchical system)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variant values table
ALTER TABLE product_variant_values ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variation dimensions table
ALTER TABLE product_variation_dimensions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product variation options table  
ALTER TABLE product_variation_options ENABLE ROW LEVEL SECURITY;