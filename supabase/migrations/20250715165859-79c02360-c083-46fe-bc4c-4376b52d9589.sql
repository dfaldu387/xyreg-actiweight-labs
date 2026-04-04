-- Clean up duplicate phases and fix standard phase flags (careful approach)

-- 1. Remove duplicate "Launch (16)" phase (keeping the original Launch phase)
DELETE FROM company_chosen_phases 
WHERE phase_id IN (
  SELECT cp.id 
  FROM company_phases cp 
  WHERE cp.name LIKE 'Launch (16)%'
);

DELETE FROM company_phases 
WHERE name LIKE 'Launch (16)%';

-- 2. Rename "Design Planning (02)" to "Project Initiation & Design Planning (02)"
UPDATE company_phases 
SET name = 'Project Initiation & Design Planning (02)'
WHERE name LIKE 'Design Planning (02)%' OR name = 'Design Planning (02)';

-- 3. Update is_predefined_core_phase flag for all numbered phases (01-15)
UPDATE company_phases 
SET is_predefined_core_phase = true
WHERE name ~ '^\([0-9]{1,2}\)' -- Matches phases starting with (1), (01), (02), etc.
AND is_predefined_core_phase = false;

-- 4. Handle position conflicts by processing each company separately
DO $$
DECLARE
    company_record RECORD;
    phase_record RECORD;
    new_position INTEGER;
    max_position INTEGER;
BEGIN
    -- For each company, fix the positions of numbered phases
    FOR company_record IN SELECT DISTINCT company_id FROM company_phases WHERE name ~ '^\([0-9]{1,2}\)' LOOP
        -- Get the maximum position for this company to avoid conflicts
        SELECT COALESCE(MAX(position), 0) INTO max_position 
        FROM company_phases 
        WHERE company_id = company_record.company_id 
        AND NOT (name ~ '^\([0-9]{1,2}\)' AND is_predefined_core_phase = true);
        
        -- Update each numbered phase for this company
        FOR phase_record IN 
            SELECT id, name, CAST(substring(name from '^\(([0-9]{1,2})\)') AS INTEGER) as target_position
            FROM company_phases 
            WHERE company_id = company_record.company_id 
            AND name ~ '^\([0-9]{1,2}\)' 
            AND is_predefined_core_phase = true
        LOOP
            -- Check if the target position is already taken by a non-numbered phase
            IF EXISTS (
                SELECT 1 FROM company_phases 
                WHERE company_id = company_record.company_id 
                AND position = phase_record.target_position 
                AND id != phase_record.id
                AND NOT (name ~ '^\([0-9]{1,2}\)' AND is_predefined_core_phase = true)
            ) THEN
                -- Move the conflicting phase to a higher position
                max_position := max_position + 1;
                UPDATE company_phases 
                SET position = max_position
                WHERE company_id = company_record.company_id 
                AND position = phase_record.target_position 
                AND id != phase_record.id;
            END IF;
            
            -- Now update the numbered phase to its correct position
            UPDATE company_phases 
            SET position = phase_record.target_position
            WHERE id = phase_record.id;
        END LOOP;
    END LOOP;
END $$;