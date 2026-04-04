-- Update phases to set correct pre-revenue/post-revenue classification
-- Phases 08 and C4 are post-revenue (is_pre_launch = false)
-- All others are pre-revenue (is_pre_launch = true)

UPDATE company_phases 
SET is_pre_launch = false 
WHERE name IN ('(08) Design Change Control', '(C4) Post-Market Surveillance');

-- Also update any variations of these phase names that might exist
UPDATE company_phases 
SET is_pre_launch = false 
WHERE name ILIKE '%design change control%' 
   OR name ILIKE '%post-market surveillance%'
   OR name ILIKE '%post market surveillance%'
   OR name ILIKE '%(08)%'
   OR name ILIKE '%(c4)%';

-- Ensure all other phases are set to pre-revenue (is_pre_launch = true)
UPDATE company_phases 
SET is_pre_launch = true 
WHERE is_pre_launch IS NULL 
   OR (is_pre_launch = false AND name NOT ILIKE '%design change control%' 
       AND name NOT ILIKE '%post-market surveillance%' 
       AND name NOT ILIKE '%post market surveillance%'
       AND name NOT ILIKE '%(08)%'
       AND name NOT ILIKE '%(c4)%');