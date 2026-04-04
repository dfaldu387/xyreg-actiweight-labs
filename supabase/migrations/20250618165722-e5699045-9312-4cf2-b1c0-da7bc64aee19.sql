
-- Phase Name Cleanup Migration (Fixed)
-- Removes all numbering prefixes and handles duplicates

BEGIN;

-- Step 1: Archive existing data for safety
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'phase_name_cleanup_backup',
  jsonb_build_object(
    'phases', (SELECT jsonb_agg(to_jsonb(p.*)) FROM phases p),
    'company_chosen_phases', (SELECT jsonb_agg(to_jsonb(ccp.*)) FROM company_chosen_phases ccp),
    'lifecycle_phases', (SELECT jsonb_agg(to_jsonb(lp.*)) FROM lifecycle_phases lp),
    'phase_assigned_documents', (SELECT jsonb_agg(to_jsonb(pad.*)) FROM phase_assigned_documents pad)
  ),
  'phase_name_cleanup'
WHERE NOT EXISTS (
  SELECT 1 FROM archived_pms_data 
  WHERE table_name = 'phase_name_cleanup_backup' 
  AND migration_phase = 'phase_name_cleanup'
);

-- Step 2: Create function to clean phase names (remove numbering prefixes)
CREATE OR REPLACE FUNCTION clean_phase_name(phase_name text) 
RETURNS text AS $$
BEGIN
  -- Remove various numbering patterns: (1), (01), (07), etc.
  RETURN TRIM(
    REGEXP_REPLACE(
      phase_name, 
      '^\([0-9]+\)\s*', 
      '', 
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Handle duplicates by merging them
CREATE OR REPLACE FUNCTION merge_duplicate_phases()
RETURNS void AS $$
DECLARE
  company_rec RECORD;
  phase_group RECORD;
  keeper_phase_id uuid;
  duplicate_phase_id uuid;
  duplicate_ids uuid[];
BEGIN
  -- For each company, find phase groups that will become duplicates after cleaning names
  FOR company_rec IN 
    SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    RAISE NOTICE 'Processing company: %', company_rec.name;
    
    -- Find groups of phases that will have the same cleaned name
    FOR phase_group IN
      SELECT 
        clean_phase_name(name) as cleaned_name,
        array_agg(id ORDER BY inserted_at) as phase_ids,
        array_agg(name ORDER BY inserted_at) as phase_names
      FROM phases 
      WHERE company_id = company_rec.id
      GROUP BY clean_phase_name(name)
      HAVING COUNT(*) > 1
    LOOP
      RAISE NOTICE 'Found duplicate group for company %: % (phases: %)', 
        company_rec.name, phase_group.cleaned_name, phase_group.phase_names;
      
      -- Keep the first phase (oldest), merge others into it
      keeper_phase_id := phase_group.phase_ids[1];
      duplicate_ids := phase_group.phase_ids[2:];
      
      -- For each duplicate phase
      FOREACH duplicate_phase_id IN ARRAY duplicate_ids
      LOOP
        RAISE NOTICE 'Merging phase % into %', duplicate_phase_id, keeper_phase_id;
        
        -- Transfer documents from duplicate to keeper
        UPDATE phase_assigned_documents 
        SET phase_id = keeper_phase_id
        WHERE phase_id = duplicate_phase_id
        AND NOT EXISTS (
          -- Avoid creating document name duplicates
          SELECT 1 FROM phase_assigned_documents existing
          WHERE existing.phase_id = keeper_phase_id 
          AND existing.name = phase_assigned_documents.name
        );
        
        -- Delete remaining documents (duplicates by name)
        DELETE FROM phase_assigned_documents 
        WHERE phase_id = duplicate_phase_id;
        
        -- Transfer lifecycle phases (product assignments)
        UPDATE lifecycle_phases 
        SET phase_id = keeper_phase_id,
            name = phase_group.cleaned_name
        WHERE phase_id = duplicate_phase_id;
        
        -- Remove from company_chosen_phases
        DELETE FROM company_chosen_phases 
        WHERE phase_id = duplicate_phase_id;
        
        -- Delete the duplicate phase
        DELETE FROM phases WHERE id = duplicate_phase_id;
      END LOOP;
      
      -- Update the keeper phase name to cleaned version
      UPDATE phases 
      SET name = phase_group.cleaned_name,
          updated_at = now()
      WHERE id = keeper_phase_id;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Execute the duplicate merging
SELECT merge_duplicate_phases();

-- Step 5: Clean all remaining phase names (those that weren't duplicates)
UPDATE phases 
SET name = clean_phase_name(name),
    updated_at = now()
WHERE name != clean_phase_name(name);

-- Step 6: Update lifecycle_phases to match cleaned names
UPDATE lifecycle_phases 
SET name = p.name
FROM phases p 
WHERE lifecycle_phases.phase_id = p.id 
AND lifecycle_phases.name != p.name;

-- Step 7: Verification queries to check results
DO $$
DECLARE
  duplicate_count integer;
  total_phases integer;
  total_companies integer;
BEGIN
  -- Check for remaining duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT company_id, name, COUNT(*) as cnt
    FROM phases
    GROUP BY company_id, name
    HAVING COUNT(*) > 1
  ) duplicates;
  
  SELECT COUNT(*) INTO total_phases FROM phases;
  SELECT COUNT(*) INTO total_companies FROM companies WHERE is_archived = false;
  
  RAISE NOTICE 'Phase cleanup completed:';
  RAISE NOTICE '- Total phases: %', total_phases;
  RAISE NOTICE '- Total companies: %', total_companies;
  RAISE NOTICE '- Remaining duplicates: %', duplicate_count;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Still have % duplicate phase names after cleanup', duplicate_count;
  ELSE
    RAISE NOTICE 'All duplicates successfully resolved';
  END IF;
END;
$$;

-- Step 8: Clean up functions
DROP FUNCTION IF EXISTS clean_phase_name(text);
DROP FUNCTION IF EXISTS merge_duplicate_phases();

-- Step 9: Update company timestamps
UPDATE companies SET updated_at = now() WHERE is_archived = false;

COMMIT;
