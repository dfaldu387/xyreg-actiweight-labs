-- Fix the ambiguous column reference in safe_reorder_company_phases function
-- This version eliminates all ambiguity by being explicit about column references
CREATE OR REPLACE FUNCTION safe_reorder_company_phases(
  target_company_id uuid,
  phase_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_position integer;
  current_phase_id uuid;
  new_position integer;
  temp_offset integer := 10000; -- Large offset to ensure no conflicts
BEGIN
  -- Check if all phase_ids belong to the target company
  -- Use explicit table prefixes and avoid any ambiguous references
  IF EXISTS (
    SELECT 1 
    FROM unnest(phase_ids) AS input_phase_id
    WHERE NOT EXISTS (
      SELECT 1 
      FROM company_chosen_phases ccp_inner
      JOIN company_phases cp_inner ON cp_inner.id = ccp_inner.phase_id
      WHERE ccp_inner.phase_id = input_phase_id
      AND cp_inner.company_id = target_company_id
    )
  ) THEN
    RAISE EXCEPTION 'One or more phases do not belong to the target company';
  END IF;

  -- Get the current maximum position for this company
  SELECT COALESCE(MAX(ccp.position), 0) INTO max_position
  FROM company_chosen_phases ccp
  WHERE ccp.company_id = target_company_id;

  -- First pass: Set all positions to temporary values (max_position + temp_offset + index)
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    current_phase_id := phase_ids[i];
    
    UPDATE company_chosen_phases ccp
    SET position = max_position + temp_offset + i
    WHERE ccp.company_id = target_company_id
    AND ccp.phase_id = current_phase_id;
  END LOOP;

  -- Second pass: Set final positions
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    current_phase_id := phase_ids[i];
    
    UPDATE company_chosen_phases ccp
    SET position = i - 1  -- 0-based positioning
    WHERE ccp.company_id = target_company_id
    AND ccp.phase_id = current_phase_id;
  END LOOP;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reorder phases: %', SQLERRM;
END;
$$;