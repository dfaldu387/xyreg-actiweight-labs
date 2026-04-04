-- Drop existing check constraints for likelihood and impact
ALTER TABLE public.product_high_level_risks 
DROP CONSTRAINT IF EXISTS product_high_level_risks_likelihood_check;

ALTER TABLE public.product_high_level_risks 
DROP CONSTRAINT IF EXISTS product_high_level_risks_impact_check;

-- Add new check constraints that allow 0 (for "None known" risks) or 1-5
ALTER TABLE public.product_high_level_risks 
ADD CONSTRAINT product_high_level_risks_likelihood_check 
CHECK (likelihood >= 0 AND likelihood <= 5);

ALTER TABLE public.product_high_level_risks 
ADD CONSTRAINT product_high_level_risks_impact_check 
CHECK (impact >= 0 AND impact <= 5);