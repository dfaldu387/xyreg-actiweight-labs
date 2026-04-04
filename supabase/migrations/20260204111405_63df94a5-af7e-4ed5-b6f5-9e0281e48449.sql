-- First, delete any orphaned lifecycle_phases entries where the phase is no longer in company_chosen_phases
-- This cleans up the specific issue with "The OS Boot Sequence" phase
DELETE FROM lifecycle_phases lp
WHERE NOT EXISTS (
  SELECT 1 FROM company_chosen_phases ccp 
  JOIN products p ON p.company_id = ccp.company_id
  WHERE ccp.phase_id = lp.phase_id 
  AND p.id = lp.product_id
);

-- Update the has_phase_dependencies function to only consider lifecycle_phases that are 
-- backed by company_chosen_phases (i.e., properly synced, not orphaned)
CREATE OR REPLACE FUNCTION has_phase_dependencies(input_phase_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if phase has lifecycle_phases dependencies that are backed by company_chosen_phases
  -- (i.e., properly synced phases, not orphaned entries)
  IF EXISTS (
    SELECT 1 FROM lifecycle_phases lp
    JOIN products p ON lp.product_id = p.id
    JOIN company_chosen_phases ccp ON ccp.phase_id = lp.phase_id AND ccp.company_id = p.company_id
    WHERE lp.phase_id = input_phase_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if phase has documents dependencies  
  IF EXISTS (
    SELECT 1 FROM documents 
    WHERE phase_id = input_phase_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if phase is in company_chosen_phases (actively selected)
  IF EXISTS (
    SELECT 1 FROM company_chosen_phases 
    WHERE phase_id = input_phase_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;