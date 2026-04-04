-- Create product_variant_distributions table in stages to avoid deadlock
CREATE TABLE public.product_variant_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id UUID NOT NULL,
  source_variant_id UUID,
  target_variant_id UUID NOT NULL,
  distribution_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  distribution_method TEXT NOT NULL DEFAULT 'fixed_percentages',
  conditional_rules JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT fk_pvd_relationship 
FOREIGN KEY (relationship_id) REFERENCES public.product_accessory_relationships(id) ON DELETE CASCADE;

ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT fk_pvd_source_variant 
FOREIGN KEY (source_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;

ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT fk_pvd_target_variant 
FOREIGN KEY (target_variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT check_distribution_percentage 
CHECK (distribution_percentage >= 0 AND distribution_percentage <= 100);

ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT check_distribution_method 
CHECK (distribution_method IN ('fixed_percentages', 'conditional_logic', 'equal_distribution'));

-- Add unique constraint
ALTER TABLE public.product_variant_distributions
ADD CONSTRAINT unique_source_target_relationship 
UNIQUE (relationship_id, source_variant_id, target_variant_id);