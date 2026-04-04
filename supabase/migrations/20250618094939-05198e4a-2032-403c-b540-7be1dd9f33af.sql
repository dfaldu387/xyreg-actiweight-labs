
-- Add function to handle phase name changes and cascade updates
CREATE OR REPLACE FUNCTION handle_phase_name_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the phase name change
  RAISE NOTICE 'Phase name changed from "%" to "%" for phase_id: %', OLD.name, NEW.name, NEW.id;
  
  -- Update any references that might use phase names (though most should use phase_id)
  -- This is mainly for logging and audit purposes
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for phase name changes
DROP TRIGGER IF EXISTS phase_name_change_trigger ON company_phases;
CREATE TRIGGER phase_name_change_trigger
  AFTER UPDATE OF name ON company_phases
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION handle_phase_name_change();

-- Add function to clean up duplicate phases for a company
CREATE OR REPLACE FUNCTION cleanup_duplicate_phases(target_company_id uuid)
RETURNS TABLE(
  action_taken text,
  old_phase_name text,
  new_phase_name text,
  documents_moved integer
) AS $$
DECLARE
  phase_record RECORD;
  duplicate_record RECORD;
  doc_count integer;
BEGIN
  -- Find phases with similar names (ignoring number prefixes)
  FOR phase_record IN
    SELECT DISTINCT 
      regexp_replace(name, '^\(\d+\)\s*', '', 'g') as clean_name,
      array_agg(id ORDER BY created_at) as phase_ids,
      array_agg(name ORDER BY created_at) as phase_names
    FROM company_phases 
    WHERE company_id = target_company_id
    GROUP BY regexp_replace(name, '^\(\d+\)\s*', '', 'g')
    HAVING count(*) > 1
  LOOP
    -- Keep the first (oldest) phase, merge documents from duplicates
    FOR i IN 2..array_length(phase_record.phase_ids, 1) LOOP
      -- Count documents to be moved
      SELECT COUNT(*) INTO doc_count
      FROM phase_assigned_documents 
      WHERE phase_id = phase_record.phase_ids[i];
      
      -- Move documents from duplicate phase to the main phase
      UPDATE phase_assigned_documents 
      SET phase_id = phase_record.phase_ids[1]
      WHERE phase_id = phase_record.phase_ids[i];
      
      -- Remove the duplicate phase from company_chosen_phases
      DELETE FROM company_chosen_phases 
      WHERE phase_id = phase_record.phase_ids[i] AND company_id = target_company_id;
      
      -- Remove the duplicate phase
      DELETE FROM company_phases 
      WHERE id = phase_record.phase_ids[i];
      
      RETURN QUERY SELECT 
        'merged_duplicate'::text,
        phase_record.phase_names[i],
        phase_record.phase_names[1],
        doc_count;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to transfer documents between phases
CREATE OR REPLACE FUNCTION transfer_phase_documents(
  source_phase_id uuid,
  target_phase_id uuid
)
RETURNS integer AS $$
DECLARE
  doc_count integer;
BEGIN
  -- Count documents to transfer
  SELECT COUNT(*) INTO doc_count
  FROM phase_assigned_documents 
  WHERE phase_id = source_phase_id;
  
  -- Transfer documents
  UPDATE phase_assigned_documents 
  SET phase_id = target_phase_id
  WHERE phase_id = source_phase_id;
  
  RETURN doc_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to prevent duplicate phase names within a company
ALTER TABLE company_phases 
DROP CONSTRAINT IF EXISTS unique_company_phase_name;

ALTER TABLE company_phases 
ADD CONSTRAINT unique_company_phase_name 
UNIQUE (company_id, name);
