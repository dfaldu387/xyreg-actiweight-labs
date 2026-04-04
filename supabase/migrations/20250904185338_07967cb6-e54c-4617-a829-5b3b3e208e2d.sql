-- Fix Post-Market Surveillance phases to have correct is_pre_launch value
UPDATE company_phases 
SET is_pre_launch = false 
WHERE LOWER(name) LIKE '%post%market%surveillance%' 
   OR LOWER(name) LIKE '%post-market%surveillance%'
   OR LOWER(name) LIKE '%pms%'
   OR LOWER(name) LIKE '%(c4)%';

-- Verify the update worked
SELECT id, name, is_pre_launch, description 
FROM company_phases 
WHERE LOWER(name) LIKE '%post%market%surveillance%' 
   OR LOWER(name) LIKE '%post-market%surveillance%'
   OR LOWER(name) LIKE '%pms%'
   OR LOWER(name) LIKE '%(c4)%';