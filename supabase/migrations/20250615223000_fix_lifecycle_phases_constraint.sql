
-- Drop the incorrect unique constraint that only allows one phase per product.
-- The name is based on the error message in the console logs.
ALTER TABLE public.lifecycle_phases DROP CONSTRAINT IF EXISTS lifecycle_phases_product_id_unique;

-- Add the correct composite unique constraint on product_id and phase_id.
-- This ensures a product can have many different phases, but not the same phase twice.
ALTER TABLE public.lifecycle_phases 
ADD CONSTRAINT lifecycle_phases_product_id_phase_id_unique UNIQUE (product_id, phase_id);
