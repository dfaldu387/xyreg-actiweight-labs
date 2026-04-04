-- Add default markets to companies table
ALTER TABLE companies ADD COLUMN default_markets jsonb DEFAULT '[]'::jsonb;

-- Add markets to device categories table
ALTER TABLE company_device_categories ADD COLUMN markets jsonb DEFAULT '[]'::jsonb;

-- Add markets to platforms table  
ALTER TABLE company_platforms ADD COLUMN markets jsonb DEFAULT '[]'::jsonb;

-- Add markets to product models table
ALTER TABLE company_product_models ADD COLUMN markets jsonb DEFAULT '[]'::jsonb;

-- Add metadata to track market inheritance
ALTER TABLE products ADD COLUMN market_inheritance_source text DEFAULT 'individual';
ALTER TABLE products ADD COLUMN market_inheritance_path text[];

-- Create indexes for better performance
CREATE INDEX idx_companies_default_markets ON companies USING GIN (default_markets);
CREATE INDEX idx_categories_markets ON company_device_categories USING GIN (markets);
CREATE INDEX idx_platforms_markets ON company_platforms USING GIN (markets);
CREATE INDEX idx_models_markets ON company_product_models USING GIN (markets);
CREATE INDEX idx_products_market_inheritance ON products (market_inheritance_source);

-- Add comments for documentation
COMMENT ON COLUMN companies.default_markets IS 'Default markets for all products in the company. Format: array of enhanced market objects';
COMMENT ON COLUMN company_device_categories.markets IS 'Markets for this device category. Overrides company defaults';
COMMENT ON COLUMN company_platforms.markets IS 'Markets for this platform. Overrides category markets';  
COMMENT ON COLUMN company_product_models.markets IS 'Markets for this model. Overrides platform markets';
COMMENT ON COLUMN products.market_inheritance_source IS 'Source of market configuration: company, category, platform, model, or individual';
COMMENT ON COLUMN products.market_inheritance_path IS 'Array showing inheritance chain: [company, category, platform, model]';