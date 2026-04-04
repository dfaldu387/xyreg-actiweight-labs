
-- Fix the lifecycle_phases constraint to allow multiple phases per product
-- but prevent duplicates for the same company_phase_id

-- Drop the problematic constraint that only allows one phase per product
ALTER TABLE public.lifecycle_phases DROP CONSTRAINT IF EXISTS lifecycle_phases_product_id_phase_id_unique;

-- Add the correct constraint on product_id and company_phase_id
-- This allows a product to have multiple phase records but prevents duplicates for the same company phase
ALTER TABLE public.lifecycle_phases 
ADD CONSTRAINT lifecycle_phases_product_id_company_phase_id_unique 
UNIQUE (product_id, company_phase_id);

-- Ensure we have an index for performance on the new constraint
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_product_company_phase 
ON public.lifecycle_phases (product_id, company_phase_id);

-- Clean up any potential duplicate records that might exist
-- Keep only the most recent record for each product_id + company_phase_id combination
DELETE FROM public.lifecycle_phases 
WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, company_phase_id) id
  FROM public.lifecycle_phases
  ORDER BY product_id, company_phase_id, updated_at DESC
);
