-- Create a function to safely reorder company phases when dragging in timeline
CREATE OR REPLACE FUNCTION public.safe_reorder_company_phases(
  target_company_id uuid,
  phase_ids uuid[]
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  phase_count integer;
  expected_count integer;
  i integer;
BEGIN
  -- Get the count of phases that should be reordered
  SELECT count(*) INTO expected_count
  FROM company_chosen_phases
  WHERE company_id = target_company_id;
  
  -- Verify that the number of phase IDs matches the expected count
  IF array_length(phase_ids, 1) != expected_count THEN
    RAISE EXCEPTION 'Phase count mismatch: expected %, got %', expected_count, array_length(phase_ids, 1);
  END IF;
  
  -- Verify all phase IDs exist for this company
  SELECT count(*) INTO phase_count
  FROM company_chosen_phases ccp
  JOIN company_phases cp ON cp.id = ccp.phase_id
  WHERE ccp.company_id = target_company_id 
    AND cp.id = ANY(phase_ids);
  
  IF phase_count != expected_count THEN
    RAISE EXCEPTION 'Invalid phase IDs provided for company %', target_company_id;
  END IF;
  
  -- Update positions based on the new order
  FOR i IN 1..array_length(phase_ids, 1) LOOP
    UPDATE company_chosen_phases
    SET position = i
    WHERE company_id = target_company_id
      AND phase_id = phase_ids[i];
  END LOOP;
  
  RETURN true;
END;
$function$;