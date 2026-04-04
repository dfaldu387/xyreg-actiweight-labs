-- Comprehensive cleanup of duplicate phases across all companies

-- Step 1: Create a function to clean up duplicate phases for a company
CREATE OR REPLACE FUNCTION cleanup_duplicate_company_phases(target_company_id uuid)
RETURNS TABLE(
  action_taken text,
  phase_name text,
  duplicates_removed integer,
  success boolean
) 
LANGUAGE plpgsql
AS $$
DECLARE
  phase_name_rec record;
  duplicate_count integer;
  kept_phase_id uuid;
BEGIN
  -- Process each duplicate phase name for this company
  FOR phase_name_rec IN 
    SELECT cp.name, COUNT(*) as count
    FROM company_phases cp
    WHERE cp.company_id = target_company_id
    GROUP BY cp.name
    HAVING COUNT(*) > 1
  LOOP
    -- Get the best phase to keep (prefer one with category, then oldest)
    SELECT cp.id INTO kept_phase_id
    FROM company_phases cp
    WHERE cp.company_id = target_company_id 
      AND cp.name = phase_name_rec.name
    ORDER BY 
      CASE WHEN cp.category_id IS NOT NULL THEN 1 ELSE 2 END,
      cp.created_at ASC
    LIMIT 1;
    
    -- Count duplicates before deletion
    SELECT COUNT(*) - 1 INTO duplicate_count
    FROM company_phases cp
    WHERE cp.company_id = target_company_id 
      AND cp.name = phase_name_rec.name;
    
    -- Update any chosen_phases references to point to the kept phase
    UPDATE company_chosen_phases 
    SET phase_id = kept_phase_id
    WHERE company_id = target_company_id
      AND phase_id IN (
        SELECT cp.id 
        FROM company_phases cp 
        WHERE cp.company_id = target_company_id 
          AND cp.name = phase_name_rec.name 
          AND cp.id != kept_phase_id
      );
    
    -- Remove duplicate chosen_phases entries (in case multiple point to same phase now)
    WITH numbered_chosen AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id, phase_id ORDER BY created_at ASC) as rn
      FROM company_chosen_phases
      WHERE company_id = target_company_id AND phase_id = kept_phase_id
    )
    DELETE FROM company_chosen_phases 
    WHERE id IN (SELECT id FROM numbered_chosen WHERE rn > 1);
    
    -- Delete duplicate phase records
    DELETE FROM company_phases 
    WHERE company_id = target_company_id 
      AND name = phase_name_rec.name 
      AND id != kept_phase_id;
    
    RETURN QUERY SELECT 
      'duplicate_cleanup'::text,
      phase_name_rec.name,
      duplicate_count,
      true;
  END LOOP;
  
  -- Final cleanup of any orphaned chosen_phases
  DELETE FROM company_chosen_phases ccp
  WHERE ccp.company_id = target_company_id
    AND NOT EXISTS (
      SELECT 1 FROM company_phases cp 
      WHERE cp.id = ccp.phase_id AND cp.company_id = target_company_id
    );
    
  RETURN QUERY SELECT 
    'orphan_cleanup'::text,
    'All orphaned references'::text,
    0,
    true;
END;
$$;

-- Step 2: Run cleanup for all companies
DO $$
DECLARE
  company_rec record;
  cleanup_rec record;
BEGIN
  FOR company_rec IN 
    SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    RAISE NOTICE 'Cleaning up duplicates for company: % (%)', company_rec.name, company_rec.id;
    
    FOR cleanup_rec IN 
      SELECT * FROM cleanup_duplicate_company_phases(company_rec.id)
    LOOP
      RAISE NOTICE 'Company %: % - % (removed %)', 
        company_rec.name, cleanup_rec.action_taken, cleanup_rec.phase_name, cleanup_rec.duplicates_removed;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 3: Add constraints to prevent future duplicates
ALTER TABLE company_phases 
ADD CONSTRAINT unique_company_phase_name 
UNIQUE (company_id, name);

-- Step 4: Add a validation function for phase operations
CREATE OR REPLACE FUNCTION validate_phase_addition(p_company_id uuid, p_phase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phase_exists boolean;
  phase_name text;
  already_active boolean;
BEGIN
  -- Check if phase exists
  SELECT EXISTS(
    SELECT 1 FROM company_phases 
    WHERE id = p_phase_id AND company_id = p_company_id
  ) INTO phase_exists;
  
  IF NOT phase_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Phase not found for this company'
    );
  END IF;
  
  -- Get phase name for better error messages
  SELECT name INTO phase_name
  FROM company_phases 
  WHERE id = p_phase_id;
  
  -- Check if already active
  SELECT EXISTS(
    SELECT 1 FROM company_chosen_phases 
    WHERE company_id = p_company_id AND phase_id = p_phase_id
  ) INTO already_active;
  
  IF already_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Phase "%s" is already active', phase_name),
      'phase_name', phase_name
    );
  END IF;
  
  -- All validations passed
  RETURN jsonb_build_object(
    'valid', true,
    'phase_name', phase_name
  );
END;
$$;