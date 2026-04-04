-- Add new IP Strategy fields for enhanced FTO assessment
-- fto_certainty: uncertain -> preliminary -> confident -> certain
-- fto_status: full_fto -> partial_fto -> limited_fto -> no_fto  
-- fto_mitigation_strategy: text field for strategy when FTO is limited
-- no_ip_applicable: boolean flag for when product has no IP needs

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS fto_certainty text,
ADD COLUMN IF NOT EXISTS fto_status text,
ADD COLUMN IF NOT EXISTS fto_mitigation_strategy text,
ADD COLUMN IF NOT EXISTS no_ip_applicable boolean DEFAULT false;

-- Add check constraints for the new enum-like fields
ALTER TABLE public.products
ADD CONSTRAINT products_fto_certainty_check 
CHECK (fto_certainty IS NULL OR fto_certainty IN ('uncertain', 'preliminary', 'confident', 'certain'));

ALTER TABLE public.products
ADD CONSTRAINT products_fto_status_check 
CHECK (fto_status IS NULL OR fto_status IN ('full_fto', 'partial_fto', 'limited_fto', 'no_fto'));

-- Add comment for documentation
COMMENT ON COLUMN public.products.fto_certainty IS 'FTO analysis certainty level: uncertain, preliminary, confident, certain';
COMMENT ON COLUMN public.products.fto_status IS 'FTO status: full_fto, partial_fto, limited_fto, no_fto';
COMMENT ON COLUMN public.products.fto_mitigation_strategy IS 'Strategy to overcome FTO limitations (e.g., license purchase, design around)';
COMMENT ON COLUMN public.products.no_ip_applicable IS 'Flag indicating no IP protection is applicable for this product';