-- Fix is_pre_launch for positions 8 and 12 specifically
-- Position 8 should be post-revenue (is_pre_launch = false)
-- Position 12 should be post-revenue (is_pre_launch = false)

UPDATE company_phases 
SET is_pre_launch = false, updated_at = now()
WHERE position IN (8, 12);

-- Also update any records by name pattern to ensure consistency
UPDATE company_phases 
SET is_pre_launch = false, updated_at = now()
WHERE name LIKE '%(8)%' OR name LIKE '%(12)%';