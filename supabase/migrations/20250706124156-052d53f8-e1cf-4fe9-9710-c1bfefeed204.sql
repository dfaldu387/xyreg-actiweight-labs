
-- Fix the phase ordering constraint issue and correct the wrong positions
-- First, temporarily disable the constraint to allow reordering
ALTER TABLE company_chosen_phases DROP CONSTRAINT IF EXISTS unique_company_chosen_phase_position;

-- Fix the specific wrong positions for phases (06) Validation and (07) Design Transfer
-- Get the company_id for "New company after Migrations" and fix the positions
WITH company_info AS (
  SELECT id as company_id FROM companies WHERE name = 'New company after Migrations'
),
phase_fixes AS (
  SELECT 
    ccp.id,
    ccp.company_id,
    ccp.phase_id,
    cp.name,
    CASE 
      WHEN cp.name LIKE '%(06)%' THEN 5  -- Validation should be at position 5
      WHEN cp.name LIKE '%(07)%' THEN 6  -- Design Transfer should be at position 6
      ELSE ccp.position
    END as correct_position
  FROM company_chosen_phases ccp
  JOIN company_phases cp ON cp.id = ccp.phase_id
  JOIN company_info ci ON ci.company_id = ccp.company_id
  WHERE cp.name LIKE '%(06)%' OR cp.name LIKE '%(07)%'
)
UPDATE company_chosen_phases 
SET position = phase_fixes.correct_position
FROM phase_fixes
WHERE company_chosen_phases.id = phase_fixes.id;

-- Recreate the unique constraint
ALTER TABLE company_chosen_phases 
ADD CONSTRAINT unique_company_chosen_phase_position 
UNIQUE (company_id, position);

-- Create a function to safely reorder phases without constraint violations
CREATE OR REPLACE FUNCTION safe_reorder_company_phases(
  target_company_id uuid,
  phase_ids uuid[]
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  phase_id_item uuid;
  new_position integer := 0;
BEGIN
  -- First, set all positions to negative values to avoid constraint violations
  UPDATE company_chosen_phases 
  SET position = -1 - position
  WHERE company_id = target_company_id
    AND phase_id = ANY(phase_ids);
  
  -- Then update to correct positions
  FOREACH phase_id_item IN ARRAY phase_ids
  LOOP
    UPDATE company_chosen_phases 
    SET position = new_position
    WHERE company_id = target_company_id 
      AND phase_id = phase_id_item;
    
    new_position := new_position + 1;
  END LOOP;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Rollback on error
  RAISE NOTICE 'Error reordering phases: %', SQLERRM;
  RETURN false;
END;
$$;
