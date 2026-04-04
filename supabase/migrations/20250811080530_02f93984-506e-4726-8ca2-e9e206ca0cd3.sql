-- Harden the function by setting an explicit search_path
CREATE OR REPLACE FUNCTION public.safe_reorder_company_phases(
  target_company_id uuid,
  phase_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  max_position integer;
  current_phase_id uuid;
  new_position integer;
  temp_offset integer := 10000; -- Large offset to ensure no conflicts
BEGIN
  -- Validate all phase_ids belong to the target company
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

  -- Get current maximum position for this company
  SELECT COALESCE(MAX(ccp.position), 0) INTO max_position
  FROM company_chosen_phases ccp
  WHERE ccp.company_id = target_company_id;

  -- First pass: assign temporary positions to avoid unique conflicts
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    current_phase_id := phase_ids[i];

    UPDATE company_chosen_phases ccp
    SET position = max_position + temp_offset + i
    WHERE ccp.company_id = target_company_id
      AND ccp.phase_id = current_phase_id;
  END LOOP;

  -- Second pass: assign final positions (0-based)
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    current_phase_id := phase_ids[i];

    UPDATE company_chosen_phases ccp
    SET position = i - 1
    WHERE ccp.company_id = target_company_id
      AND ccp.phase_id = current_phase_id;
  END LOOP;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reorder phases: %', SQLERRM;
END;
$$;