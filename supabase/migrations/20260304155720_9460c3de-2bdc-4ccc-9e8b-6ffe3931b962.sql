
-- Add nullable product_id column to product_variation_dimensions
-- NULL = company-wide dimension (managed in Settings)
-- non-NULL = product-family-specific dimension (managed in Variants tab)
ALTER TABLE public.product_variation_dimensions
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_variation_dimensions_product_id
ON public.product_variation_dimensions(product_id);
