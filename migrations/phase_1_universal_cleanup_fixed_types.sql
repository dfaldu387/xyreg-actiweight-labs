
-- Phase 1: Universal Duplicate Cleanup and System Phase Marking (Fixed Type Issue)
-- This comprehensive migration will clean up all companies at once

-- Step 1: Temporarily disable the trigger to allow cleanup
DROP TRIGGER IF EXISTS prevent_duplicate_phase_names_trigger ON phases;

-- Step 2: Create a comprehensive cleanup function for all companies (FIXED TYPES)
CREATE OR REPLACE FUNCTION universal_phase_cleanup_and_system_marking()
RETURNS TABLE(
  company_name text,
  action_taken text,
  phase_name text,
  old_count integer,
  new_count integer,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_rec RECORD;
  phase_rec RECORD;
  duplicate_rec RECORD;
  system_category_id uuid;
  phases_processed integer;
  duplicates_merged integer;
BEGIN
  -- Process each company
  FOR company_rec IN 
    SELECT c.id, c.name 
    FROM companies c 
    WHERE c.is_archived = false
  LOOP
    phases_processed := 0;
    duplicates_merged := 0;
    
    -- Ensure "Detailed Design Control Steps" category exists
    SELECT id INTO system_category_id
    FROM phase_categories
    WHERE company_id = company_rec.id 
    AND name = 'Detailed Design Control Steps';
    
    IF system_category_id IS NULL THEN
      INSERT INTO phase_categories (company_id, name)
      VALUES (company_rec.id, 'Detailed Design Control Steps')
      RETURNING id INTO system_category_id;
      
      RETURN QUERY SELECT 
        company_rec.name,
        'created_category'::text,
        'Detailed Design Control Steps'::text,
        0,
        1,
        'Created missing category'::text;
    END IF;
    
    -- Find and merge duplicate phases
    FOR duplicate_rec IN
      SELECT 
        TRIM(REGEXP_REPLACE(p.name, '^\(\d+\)\s*', '', 'g')) as clean_name,
        COUNT(*)::integer as duplicate_count, -- FIXED: Cast to integer
        ARRAY_AGG(p.id ORDER BY 
          CASE WHEN ccp.id IS NOT NULL THEN 0 ELSE 1 END, -- Prioritize active phases
          p.is_predefined_core_phase DESC, -- Prioritize system phases
          p.inserted_at ASC -- Prioritize older phases
        ) as phase_ids
      FROM phases p
      LEFT JOIN company_chosen_phases ccp ON ccp.phase_id = p.id
      WHERE p.company_id = company_rec.id
      GROUP BY TRIM(REGEXP_REPLACE(p.name, '^\(\d+\)\s*', '', 'g'))
      HAVING COUNT(*) > 1
    LOOP
      DECLARE
        keeper_id uuid;
        to_delete_ids uuid[];
        active_position integer;
      BEGIN
        -- Keep the first phase (prioritized by the ORDER BY above)
        keeper_id := duplicate_rec.phase_ids[1];
        to_delete_ids := duplicate_rec.phase_ids[2:];
        
        -- Check if any of the duplicates are active and get position
        SELECT ccp.position INTO active_position
        FROM company_chosen_phases ccp
        WHERE ccp.phase_id = ANY(duplicate_rec.phase_ids)
        ORDER BY ccp.position
        LIMIT 1;
        
        -- Merge active status to keeper if needed
        IF active_position IS NOT NULL THEN
          INSERT INTO company_chosen_phases (company_id, phase_id, position)
          VALUES (company_rec.id, keeper_id, active_position)
          ON CONFLICT (company_id, phase_id) DO NOTHING;
        END IF;
        
        -- Remove active status from duplicates
        DELETE FROM company_chosen_phases 
        WHERE company_id = company_rec.id 
        AND phase_id = ANY(to_delete_ids);
        
        -- Delete duplicate phases first (before updating keeper to avoid conflicts)
        DELETE FROM phases WHERE id = ANY(to_delete_ids);
        
        -- Now update keeper phase properties safely
        UPDATE phases 
        SET 
          name = duplicate_rec.clean_name,
          category_id = system_category_id,
          is_predefined_core_phase = true,
          is_deletable = false,
          is_custom = false
        WHERE id = keeper_id;
        
        duplicates_merged := duplicates_merged + array_length(to_delete_ids, 1);
        
        RETURN QUERY SELECT 
          company_rec.name,
          'merged_duplicates'::text,
          duplicate_rec.clean_name,
          duplicate_rec.duplicate_count, -- Now this is integer
          1,
          format('Merged %s duplicates into 1', duplicate_rec.duplicate_count - 1);
      END;
    END LOOP;
    
    -- Clean all remaining phase names and mark system phases
    FOR phase_rec IN
      SELECT p.id, p.name, p.category_id
      FROM phases p
      WHERE p.company_id = company_rec.id
    LOOP
      DECLARE
        clean_name text;
        is_system boolean := false;
        final_category_id uuid;
      BEGIN
        -- Clean the name
        clean_name := TRIM(REGEXP_REPLACE(phase_rec.name, '^\(\d+\)\s*', '', 'g'));
        
        -- Determine if this should be a system phase
        IF phase_rec.category_id = system_category_id OR clean_name IN (
          'Concept & Feasibility',
          'Design Planning', 
          'Design Input',
          'Design Output',
          'Verification',
          'Validation (Design, Clinical, Usability)',
          'Design Transfer',
          'Design Change Control',
          'Risk Management',
          'Configuration Management',
          'Technical Documentation',
          'Clinical Evaluation',
          'Post-Market Surveillance',
          'Design Review',
          'Design History File'
        ) THEN
          is_system := true;
          final_category_id := system_category_id;
        ELSE
          is_system := false;
          final_category_id := phase_rec.category_id;
        END IF;
        
        -- Update the phase
        UPDATE phases 
        SET 
          name = clean_name,
          category_id = final_category_id,
          is_predefined_core_phase = is_system,
          is_deletable = NOT is_system,
          is_custom = NOT is_system
        WHERE id = phase_rec.id;
        
        phases_processed := phases_processed + 1;
      END;
    END LOOP;
    
    -- Renumber active phases to be sequential
    UPDATE company_chosen_phases 
    SET position = subq.new_position - 1
    FROM (
      SELECT 
        phase_id,
        ROW_NUMBER() OVER (ORDER BY position) as new_position
      FROM company_chosen_phases
      WHERE company_id = company_rec.id
    ) subq
    WHERE company_chosen_phases.company_id = company_rec.id
    AND company_chosen_phases.phase_id = subq.phase_id;
    
    RETURN QUERY SELECT 
      company_rec.name,
      'processed_company'::text,
      'All phases'::text,
      phases_processed,
      phases_processed - duplicates_merged,
      format('Processed %s phases, merged %s duplicates', phases_processed, duplicates_merged);
  END LOOP;
  
  RETURN;
END;
$$;

-- Step 3: Execute the cleanup
SELECT * FROM universal_phase_cleanup_and_system_marking();

-- Step 4: NOW create the duplicate prevention trigger (after cleanup is done)
CREATE OR REPLACE FUNCTION prevent_duplicate_phase_names()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Normalize the phase name (remove parenthetical prefixes and trim)
    NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '^\(\d+\)\s*', '', 'g'));
    
    -- Check if a phase with the same normalized name already exists for this company
    IF EXISTS (
        SELECT 1 FROM phases 
        WHERE company_id = NEW.company_id 
        AND TRIM(REGEXP_REPLACE(name, '^\(\d+\)\s*', '', 'g')) = NEW.name
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'A phase with the name "%" already exists for this company', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_phase_names_trigger
    BEFORE INSERT OR UPDATE ON phases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_phase_names();

-- Step 5: Update the new company creation trigger to create clean phases
CREATE OR REPLACE FUNCTION handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  category_id uuid;
BEGIN
  -- Ensure the "Detailed Design Control Steps" category exists for the new company
  SELECT public.ensure_detailed_design_category(NEW.id) INTO category_id;
  
  -- Insert the 15 standard lifecycle phases with clean names (no numbering)
  INSERT INTO phases (company_id, name, description, position, category_id, is_predefined_core_phase, is_deletable, is_custom)
  VALUES 
    (NEW.id, 'Concept & Feasibility', 'Initial concept development and feasibility assessment', 1, category_id, true, false, false),
    (NEW.id, 'Design Planning', 'Planning and preparation for design activities', 2, category_id, true, false, false),
    (NEW.id, 'Design Input', 'Definition of design requirements and inputs', 3, category_id, true, false, false),
    (NEW.id, 'Design Output', 'Creation of design outputs and specifications', 4, category_id, true, false, false),
    (NEW.id, 'Verification', 'Verification that design outputs meet design inputs', 5, category_id, true, false, false),
    (NEW.id, 'Validation (Design, Clinical, Usability)', 'Validation of the design under actual use conditions', 6, category_id, true, false, false),
    (NEW.id, 'Design Transfer', 'Transfer of design to manufacturing', 7, category_id, true, false, false),
    (NEW.id, 'Design Change Control', 'Management of design changes throughout lifecycle', 8, category_id, true, false, false),
    (NEW.id, 'Risk Management', 'Ongoing risk assessment and management', 9, category_id, true, false, false),
    (NEW.id, 'Configuration Management', 'Management of design configuration and versions', 10, category_id, true, false, false),
    (NEW.id, 'Technical Documentation', 'Creation and maintenance of technical documentation', 11, category_id, true, false, false),
    (NEW.id, 'Clinical Evaluation', 'Clinical assessment and evaluation activities', 12, category_id, true, false, false),
    (NEW.id, 'Post-Market Surveillance', 'Ongoing monitoring and surveillance activities', 13, category_id, true, false, false),
    (NEW.id, 'Design Review', 'Systematic review of design at key milestones', 14, category_id, true, false, false),
    (NEW.id, 'Design History File', 'Compilation and maintenance of design history', 15, category_id, true, false, false);
  
  RETURN NEW;
END;
$$;

-- Step 6: Verification queries
SELECT 
  'VERIFICATION: Companies with duplicates' as check_type,
  c.name as company_name,
  COUNT(DISTINCT p.id) as total_phases,
  COUNT(DISTINCT TRIM(REGEXP_REPLACE(p.name, '^\(\d+\)\s*', '', 'g'))) as unique_base_names,
  CASE 
    WHEN COUNT(DISTINCT p.id) = COUNT(DISTINCT TRIM(REGEXP_REPLACE(p.name, '^\(\d+\)\s*', '', 'g'))) 
    THEN 'CLEAN' 
    ELSE 'HAS_DUPLICATES' 
  END as status
FROM companies c
LEFT JOIN phases p ON p.company_id = c.id
WHERE c.is_archived = false
GROUP BY c.id, c.name
HAVING COUNT(p.id) > 0
ORDER BY status DESC, c.name;

-- Final verification: System phase marking
SELECT 
  'VERIFICATION: System phase marking' as check_type,
  c.name as company_name,
  pc.name as category_name,
  COUNT(CASE WHEN p.is_predefined_core_phase = true THEN 1 END) as system_phases,
  COUNT(CASE WHEN p.is_predefined_core_phase = false THEN 1 END) as custom_phases
FROM companies c
LEFT JOIN phases p ON p.company_id = c.id
LEFT JOIN phase_categories pc ON pc.id = p.category_id
WHERE c.is_archived = false AND pc.name = 'Detailed Design Control Steps'
GROUP BY c.id, c.name, pc.id, pc.name
ORDER BY c.name;
