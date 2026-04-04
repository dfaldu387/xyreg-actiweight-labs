
-- First, let's analyze the current constraint and fix it
-- The issue is that the unique constraint prevents multiple lifecycle phases for the same product
-- But we actually need to allow multiple phases per product, just not duplicate phase_id combinations

-- Check current constraint and drop the problematic one
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS unique_product_phase;

-- Add the correct constraint that allows multiple phases per product but prevents duplicates
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT lifecycle_phases_product_id_phase_id_unique UNIQUE (product_id, phase_id);

-- Also ensure we have proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_product_current 
ON lifecycle_phases (product_id, is_current_phase) 
WHERE is_current_phase = true;

-- Clean up any existing duplicate records that might cause issues
WITH duplicates AS (
  SELECT product_id, phase_id, MIN(id) as keep_id
  FROM lifecycle_phases
  GROUP BY product_id, phase_id
  HAVING COUNT(*) > 1
)
DELETE FROM lifecycle_phases lp
WHERE EXISTS (
  SELECT 1 FROM duplicates d 
  WHERE d.product_id = lp.product_id 
  AND d.phase_id = lp.phase_id 
  AND d.keep_id != lp.id
);
