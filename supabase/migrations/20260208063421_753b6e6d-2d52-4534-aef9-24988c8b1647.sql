-- Add strategic_partners JSONB column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS strategic_partners JSONB DEFAULT NULL;

COMMENT ON COLUMN products.strategic_partners IS 'Strategic partners data for Business Model Canvas - includes distribution, manufacturing, clinical, and regulatory partners';