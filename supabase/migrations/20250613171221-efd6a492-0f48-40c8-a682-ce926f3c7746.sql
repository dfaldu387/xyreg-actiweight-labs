
-- Create a function to rename existing phases with position-based numbers
CREATE OR REPLACE FUNCTION public.rename_phases_with_numbers(target_company_id uuid)
RETURNS TABLE(
  phase_id uuid,
  old_name text,
  new_name text,
  position_number integer,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  phase_record RECORD;
  position_counter INTEGER := 1;
  new_phase_name TEXT;
BEGIN
  -- Get all phases for the company ordered by position
  FOR phase_record IN 
    SELECT p.id, p.name, p.position
    FROM phases p
    WHERE p.company_id = target_company_id
    ORDER BY p.position, p.created_at
  LOOP
    -- Format the position number with leading zero (01, 02, etc.)
    new_phase_name := '(' || LPAD(position_counter::text, 2, '0') || ') ' || phase_record.name;
    
    -- Only update if the name doesn't already have numbers
    IF NOT phase_record.name ~ '^\(\d+\)' THEN
      -- Update the phase name
      UPDATE phases 
      SET name = new_phase_name,
          updated_at = now()
      WHERE id = phase_record.id;
      
      RETURN QUERY SELECT 
        phase_record.id,
        phase_record.name,
        new_phase_name,
        position_counter,
        true;
    ELSE
      RETURN QUERY SELECT 
        phase_record.id,
        phase_record.name,
        phase_record.name,
        position_counter,
        false; -- Already numbered
    END IF;
    
    position_counter := position_counter + 1;
  END LOOP;
  
  RETURN;
END;
$function$;
