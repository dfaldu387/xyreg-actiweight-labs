
-- Migration: Fix company_chosen_phases foreign key to reference company_phases instead of phases
-- This addresses the issue where phase activation fails due to foreign key constraint violation

BEGIN;

-- Step 1: Check if there are any orphaned records in company_chosen_phases
-- that don't have corresponding records in company_phases
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM company_chosen_phases ccp
    LEFT JOIN company_phases cp ON cp.id = ccp.phase_id
    WHERE cp.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned records in company_chosen_phases', orphaned_count;
        
        -- Clean up orphaned records
        DELETE FROM company_chosen_phases 
        WHERE phase_id NOT IN (SELECT id FROM company_phases);
        
        RAISE NOTICE 'Cleaned up % orphaned records', orphaned_count;
    END IF;
END $$;

-- Step 2: Drop the existing foreign key constraint that points to phases table
ALTER TABLE company_chosen_phases 
DROP CONSTRAINT IF EXISTS company_chosen_phases_phase_id_fkey;

-- Step 3: Create new foreign key constraint that points to company_phases table
ALTER TABLE company_chosen_phases 
ADD CONSTRAINT company_chosen_phases_phase_id_fkey 
FOREIGN KEY (phase_id) REFERENCES company_phases(id) ON DELETE CASCADE;

-- Step 4: Ensure any existing data integrity
-- Update company_chosen_phases to use company_phases IDs if there are mismatched references
UPDATE company_chosen_phases ccp
SET phase_id = cp.id
FROM company_phases cp, phases p
WHERE ccp.phase_id = p.id
  AND p.name = cp.name
  AND p.company_id = cp.company_id
  AND ccp.phase_id != cp.id;

-- Step 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_chosen_phases_phase_id 
ON company_chosen_phases(phase_id);

CREATE INDEX IF NOT EXISTS idx_company_chosen_phases_company_position 
ON company_chosen_phases(company_id, position);

COMMIT;
