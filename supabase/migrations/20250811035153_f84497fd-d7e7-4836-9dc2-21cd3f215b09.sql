-- Fix the ambiguous column reference in safe_reorder_company_phases function
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
  phase_id uuid;
  new_position integer;
  temp_offset integer := 10000; -- Large offset to ensure no conflicts
BEGIN
  -- Check if all phase_ids belong to the target company
  -- Fix: Use explicit table aliases to avoid ambiguous column reference
  IF EXISTS (
    SELECT 1 FROM company_chosen_phases ccp
    JOIN company_phases cp ON cp.id = ccp.phase_id
    WHERE ccp.phase_id = ANY(phase_ids)
    AND cp.company_id != target_company_id
  ) THEN
    RAISE EXCEPTION 'One or more phases do not belong to the target company';
  END IF;

  -- Get the current maximum position for this company
  SELECT COALESCE(MAX(position), 0) INTO max_position
  FROM company_chosen_phases
  WHERE company_id = target_company_id;

  -- First pass: Set all positions to temporary values (max_position + temp_offset + index)
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    UPDATE company_chosen_phases
    SET position = max_position + temp_offset + i
    WHERE company_id = target_company_id
    AND phase_id = phase_ids[i];
  END LOOP;

  -- Second pass: Set final positions
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    UPDATE company_chosen_phases
    SET position = i - 1  -- 0-based positioning
    WHERE company_id = target_company_id
    AND phase_id = phase_ids[i];
  END LOOP;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reorder phases: %', SQLERRM;
END;
$$;