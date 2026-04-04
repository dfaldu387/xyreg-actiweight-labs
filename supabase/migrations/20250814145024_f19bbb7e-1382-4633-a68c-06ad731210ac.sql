-- Remove redundant market inheritance tracking columns from products table
-- These are no longer needed since we'll calculate inheritance dynamically

ALTER TABLE public.products 
DROP COLUMN IF EXISTS market_inheritance_source,
DROP COLUMN IF EXISTS market_inheritance_path;

-- Add comment to document that markets column now only stores user overrides
COMMENT ON COLUMN public.products.markets IS 'User-defined market overrides for this product. If null/empty, inherits from hierarchy (model -> platform -> category -> company).';