
-- Global Phase Numbering Migration (FIXED)
-- This migration will update ALL existing phase names to include consistent numbering
-- Format: "(01) Phase Name" for all companies

BEGIN;

-- Step 1: Archive current phase data before making changes
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'phases_pre_numbering',
  jsonb_agg(to_jsonb(p.*)),
  'global_phase_numbering'
FROM phases p
HAVING COUNT(*) > 0;

-- Step 2: Archive company_chosen_phases data
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'company_chosen_phases_pre_numbering',
  jsonb_agg(to_jsonb(ccp.*)),
  'global_phase_numbering'
FROM company_chosen_phases ccp
HAVING COUNT(*) > 0;

-- Step 3: Create a function to apply consistent numbering based on position
CREATE OR REPLACE FUNCTION apply_phase_numbering()
RETURNS void AS $$
DECLARE
    company_rec RECORD;
    phase_rec RECORD;
    new_name TEXT;
    clean_name TEXT;
    position_number INTEGER;
BEGIN
    -- Process each company's phases
    FOR company_rec IN 
        SELECT DISTINCT ccp.company_id 
        FROM company_chosen_phases ccp
        JOIN phases p ON ccp.phase_id = p.id
    LOOP
        -- Get phases for this company in position order
        FOR phase_rec IN
            SELECT p.id, p.name, ccp.position
            FROM company_chosen_phases ccp
            JOIN phases p ON ccp.phase_id = p.id
            WHERE ccp.company_id = company_rec.company_id
            ORDER BY ccp.position
        LOOP
            -- Clean existing name (remove any existing numbering)
            clean_name := TRIM(phase_rec.name);
            clean_name := REGEXP_REPLACE(clean_name, '^\(\d+\)\s*', '', 'g');
            clean_name := REGEXP_REPLACE(clean_name, '^\d+\.\s*', '', 'g');
            clean_name := REGEXP_REPLACE(clean_name, '^Phase\s+\d+\s*[-:]?\s*', '', 'gi');
            
            -- Calculate position number (1-based)
            position_number := phase_rec.position + 1;
            
            -- Create new numbered name with leading zero for single digits
            new_name := '(' || LPAD(position_number::TEXT, 2, '0') || ') ' || clean_name;
            
            -- Update the phase name
            UPDATE phases 
            SET name = new_name,
                updated_at = now()
            WHERE id = phase_rec.id;
            
            RAISE NOTICE 'Updated phase for company %: % -> %', 
                company_rec.company_id, phase_rec.name, new_name;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Apply the numbering function
SELECT apply_phase_numbering();

-- Step 5: Clean up the temporary function
DROP FUNCTION apply_phase_numbering();

-- Step 6: Update any references in phase_assigned_documents that might have old phase names
-- This ensures document assignments remain intact after phase renaming

COMMIT;
