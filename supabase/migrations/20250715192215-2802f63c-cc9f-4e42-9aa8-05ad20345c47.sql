-- Initialize company phases for Medixor AB
DO $$
DECLARE
  medixor_company_id uuid;
  phase_record RECORD;
  position_counter INTEGER := 1;
BEGIN
  -- Get Medixor AB company ID
  SELECT id INTO medixor_company_id
  FROM companies
  WHERE name = 'Medixor AB';
  
  IF medixor_company_id IS NULL THEN
    RAISE EXCEPTION 'Medixor AB company not found';
  END IF;
  
  -- Clear any existing chosen phases for this company
  DELETE FROM company_chosen_phases
  WHERE company_id = medixor_company_id;
  
  -- Add all company phases to chosen phases with proper ordering
  -- First add linear phases (positions 1-8)
  FOR phase_record IN 
    SELECT id, name, position
    FROM company_phases
    WHERE company_id = medixor_company_id
    AND is_continuous_process = false
    ORDER BY position
  LOOP
    INSERT INTO company_chosen_phases (company_id, phase_id, position)
    VALUES (medixor_company_id, phase_record.id, position_counter);
    position_counter := position_counter + 1;
  END LOOP;
  
  -- Then add continuous processes (positions 9-12)
  FOR phase_record IN 
    SELECT id, name, position
    FROM company_phases
    WHERE company_id = medixor_company_id
    AND is_continuous_process = true
    ORDER BY position
  LOOP
    INSERT INTO company_chosen_phases (company_id, phase_id, position)
    VALUES (medixor_company_id, phase_record.id, position_counter);
    position_counter := position_counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Successfully initialized % chosen phases for Medixor AB', position_counter - 1;
END $$;