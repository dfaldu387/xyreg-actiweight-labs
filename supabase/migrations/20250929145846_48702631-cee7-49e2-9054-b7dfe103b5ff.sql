-- Add missing columns to product_accessory_relationships and create indexes
ALTER TABLE public.product_accessory_relationships 
ADD COLUMN IF NOT EXISTS has_variant_distribution BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS distribution_method TEXT CHECK (distribution_method IN ('fixed_percentages', 'conditional_logic', 'equal_distribution')) DEFAULT 'fixed_percentages';

-- Add indexes and trigger for the new table
CREATE INDEX IF NOT EXISTS idx_product_variant_distributions_relationship_id ON public.product_variant_distributions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_distributions_target_variant_id ON public.product_variant_distributions(target_variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_distributions_source_variant_id ON public.product_variant_distributions(source_variant_id);

-- Add trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_product_variant_distributions_updated_at'
  ) THEN
    CREATE TRIGGER update_product_variant_distributions_updated_at
      BEFORE UPDATE ON public.product_variant_distributions
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END $$;