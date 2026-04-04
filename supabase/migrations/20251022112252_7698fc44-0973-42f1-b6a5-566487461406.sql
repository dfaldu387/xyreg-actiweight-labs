-- Add feasibility_portfolio_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS feasibility_portfolio_id UUID REFERENCES feasibility_portfolios(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_feasibility_portfolio 
ON products(feasibility_portfolio_id);

-- Verify/Add eudamed_reference_number field if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS eudamed_reference_number TEXT;

-- Add index on eudamed_reference_number for uniqueness checks
CREATE INDEX IF NOT EXISTS idx_products_eudamed_reference 
ON products(eudamed_reference_number) WHERE eudamed_reference_number IS NOT NULL;