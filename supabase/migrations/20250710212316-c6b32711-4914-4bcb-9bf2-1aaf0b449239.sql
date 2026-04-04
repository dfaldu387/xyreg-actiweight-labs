-- Step 1: Clean up duplicate phases and fix data consistency issues
-- This migration addresses the issue where phases appear in both active and available lists

-- First, let's create a function to clean up duplicate phases for a specific company
CREATE OR REPLACE FUNCTION cleanup_duplicate_phases_for_company(target_company_id uuid)
RETURNS TABLE(
  action_taken text,
  phase_name text,
  duplicates_removed integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
  phase_rec RECORD;
  duplicate_count integer;
  kept_phase_id uuid;
BEGIN
  -- Find duplicate phases by name within the same company
  FOR phase_rec IN 
    SELECT 
      cp.name,
      COUNT(*) as duplicate_count,
      array_agg(cp.id ORDER BY cp.created_at ASC) as phase_ids
    FROM company_phases cp
    WHERE cp.company_id = target_company_id
    GROUP BY cp.name
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first created phase (oldest)
    kept_phase_id := phase_rec.phase_ids[1];
    duplicate_count := array_length(phase_rec.phase_ids, 1) - 1;
    
    -- Update any references in company_chosen_phases to point to the kept phase
    UPDATE company_chosen_phases 
    SET phase_id = kept_phase_id
    WHERE phase_id = ANY(phase_rec.phase_ids[2:]) 
    AND company_id = target_company_id;
    
    -- Remove the duplicate phases (keeping the first one)
    DELETE FROM company_phases 
    WHERE id = ANY(phase_rec.phase_ids[2:]) 
    AND company_id = target_company_id;
    
    RETURN QUERY SELECT 
      'removed_duplicates'::text,
      phase_rec.name,
      duplicate_count;
  END LOOP;
  
  -- Clean up orphaned entries in company_chosen_phases (where phase no longer exists)
  WITH orphaned_entries AS (
    DELETE FROM company_chosen_phases ccp
    WHERE ccp.company_id = target_company_id
    AND NOT EXISTS (
      SELECT 1 FROM company_phases cp 
      WHERE cp.id = ccp.phase_id 
      AND cp.company_id = target_company_id
    )
    RETURNING phase_id
  )
  SELECT COUNT(*) INTO duplicate_count FROM orphaned_entries;
  
  IF duplicate_count > 0 THEN
    RETURN QUERY SELECT 
      'cleaned_orphaned_entries'::text,
      'Various phases'::text,
      duplicate_count;
  END IF;
  
  -- Ensure any phase that's in company_chosen_phases exists in company_phases
  FOR phase_rec IN 
    SELECT DISTINCT ccp.phase_id, cp.name
    FROM company_chosen_phases ccp
    LEFT JOIN company_phases cp ON cp.id = ccp.phase_id
    WHERE ccp.company_id = target_company_id
    AND cp.id IS NULL
  LOOP
    -- Remove the orphaned reference
    DELETE FROM company_chosen_phases 
    WHERE phase_id = phase_rec.phase_id 
    AND company_id = target_company_id;
    
    RETURN QUERY SELECT 
      'removed_orphaned_reference'::text,
      COALESCE(phase_rec.name, 'Unknown Phase')::text,
      1;
  END LOOP;
END;
$$;

-- Step 2: Run cleanup for all companies (focusing on the problematic Medixor AB first)
DO $$
DECLARE
  company_rec RECORD;
  cleanup_rec RECORD;
BEGIN
  -- Get all companies to clean up
  FOR company_rec IN 
    SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    RAISE NOTICE 'Cleaning up duplicate phases for company: %', company_rec.name;
    
    -- Run cleanup for this company
    FOR cleanup_rec IN 
      SELECT * FROM cleanup_duplicate_phases_for_company(company_rec.id)
    LOOP
      RAISE NOTICE 'Company %: % - % (% removed)', 
        company_rec.name, 
        cleanup_rec.action_taken, 
        cleanup_rec.phase_name, 
        cleanup_rec.duplicates_removed;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 3: Add constraints to prevent future duplicates
-- Add a unique constraint on (company_id, name) to prevent duplicate phase names within a company
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'company_phases_unique_name_per_company'
    AND table_name = 'company_phases'
  ) THEN
    ALTER TABLE company_phases 
    ADD CONSTRAINT company_phases_unique_name_per_company 
    UNIQUE (company_id, name);
  END IF;
END;
$$;

-- Step 4: Create an improved validation function
CREATE OR REPLACE FUNCTION validate_phase_addition(p_company_id uuid, p_phase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  phase_exists boolean;
  already_active boolean;
  phase_name text;
  result jsonb;
BEGIN
  -- Check if phase exists in company_phases
  SELECT EXISTS(
    SELECT 1 FROM company_phases 
    WHERE id = p_phase_id AND company_id = p_company_id
  ), name INTO phase_exists, phase_name
  FROM company_phases 
  WHERE id = p_phase_id AND company_id = p_company_id;
  
  IF NOT phase_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Phase not found for this company',
      'phase_name', COALESCE(phase_name, 'Unknown')
    );
  END IF;
  
  -- Check if phase is already active
  SELECT EXISTS(
    SELECT 1 FROM company_chosen_phases 
    WHERE company_id = p_company_id AND phase_id = p_phase_id
  ) INTO already_active;
  
  IF already_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Phase is already active',
      'phase_name', phase_name
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'phase_name', phase_name
  );
END;
$$;

-- Step 5: Add helpful logging
COMMENT ON FUNCTION cleanup_duplicate_phases_for_company(uuid) IS 'Cleans up duplicate phases for a specific company and fixes data consistency issues';
COMMENT ON FUNCTION validate_phase_addition(uuid, uuid) IS 'Validates whether a phase can be added to active phases for a company';