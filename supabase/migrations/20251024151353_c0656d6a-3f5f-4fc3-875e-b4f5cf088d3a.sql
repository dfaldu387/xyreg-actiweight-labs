-- Add target_markets field to product_bundles
ALTER TABLE public.product_bundles
ADD COLUMN target_markets JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.product_bundles.target_markets IS 'Array of target market tags (e.g., ["EU", "US", "Asia-Pacific"])';

-- Create index for faster tag queries
CREATE INDEX idx_product_bundles_target_markets ON public.product_bundles USING gin(target_markets);