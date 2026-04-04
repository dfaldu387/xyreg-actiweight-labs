-- Step 1: Clean up duplicate "PMS Setup" phases
-- Keep the one with better category assignment, remove the other

WITH duplicate_pms_phases AS (
  SELECT 
    id,
    company_id,
    category_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY company_id, name 
      ORDER BY 
        CASE WHEN category_id IS NOT NULL THEN 1 ELSE 2 END, -- Prefer phases with category
        created_at ASC -- Then prefer older ones
    ) as rn
  FROM company_phases 
  WHERE name = 'PMS Setup'
),
phases_to_delete AS (
  SELECT id 
  FROM duplicate_pms_phases 
  WHERE rn > 1
)
DELETE FROM company_phases 
WHERE id IN (SELECT id FROM phases_to_delete);

-- Also clean up any orphaned chosen phases that might reference deleted phases
DELETE FROM company_chosen_phases 
WHERE phase_id NOT IN (SELECT id FROM company_phases);