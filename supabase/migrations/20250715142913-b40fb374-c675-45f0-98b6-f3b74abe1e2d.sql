-- Drop the old function if it exists
DROP FUNCTION IF EXISTS check_phase_dependencies(uuid);

-- Create the new function
CREATE OR REPLACE FUNCTION has_phase_dependencies(input_phase_id uuid) 
RETURNS boolean AS $$
BEGIN
  -- Check if phase has lifecycle_phases dependencies
  IF EXISTS (
    SELECT 1 FROM lifecycle_phases 
    WHERE phase_id = input_phase_id
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
  
  -- Check if phase is in company_chosen_phases
  IF EXISTS (
    SELECT 1 FROM company_chosen_phases 
    WHERE phase_id = input_phase_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the safe_delete_phase function
CREATE OR REPLACE FUNCTION safe_delete_phase(phase_id uuid) 
RETURNS jsonb AS $$
DECLARE
  phase_record RECORD;
  has_dependencies boolean;
BEGIN
  -- Get phase details
  SELECT * INTO phase_record 
  FROM company_phases 
  WHERE id = phase_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Phase not found'
    );
  END IF;
  
  -- Check if phase is deletable
  IF NOT phase_record.is_deletable THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This phase cannot be deleted as it is a core system phase'
    );
  END IF;
  
  -- Check dependencies
  SELECT has_phase_dependencies(phase_id) INTO has_dependencies;
  
  IF has_dependencies THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Phase cannot be deleted because it has active dependencies (products, documents, or lifecycle phases)'
    );
  END IF;
  
  -- Safe to delete
  DELETE FROM company_phases WHERE id = phase_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Phase deleted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;