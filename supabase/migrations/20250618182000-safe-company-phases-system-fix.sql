
-- Safe migration to fix company_phases system phase identification
-- This migration handles duplicate name constraints carefully

BEGIN;

-- Step 1: Add missing columns to company_phases table
ALTER TABLE company_phases 
ADD COLUMN IF NOT EXISTS is_predefined_core_phase BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deletable BOOLEAN DEFAULT true;

-- Step 2: Update category name from "Design Control" to "Detailed Design Control Steps"
UPDATE phase_categories 
SET name = 'Detailed Design Control Steps'
WHERE name = 'Design Control';

-- Step 3: Safe phase name standardization with duplicate handling
DO $$
DECLARE
  company_rec RECORD;
  phase_rec RECORD;
  new_name text;
  duplicate_count integer;
  final_name text;
BEGIN
  -- Process each company individually to avoid cross-company conflicts
  FOR company_rec IN 
    SELECT DISTINCT pc.company_id, c.name as company_name
    FROM phase_categories pc
    JOIN companies c ON c.id = pc.company_id
    WHERE pc.name = 'Detailed Design Control Steps'
  LOOP
    RAISE NOTICE 'Processing company: %', company_rec.company_name;
    
    -- First, mark all phases as system phases for this company
    UPDATE company_phases 
    SET 
      is_predefined_core_phase = true,
      is_custom = false,
      is_deletable = false,
      updated_at = now()
    WHERE company_id = company_rec.company_id
    AND category_id IN (
      SELECT id FROM phase_categories 
      WHERE company_id = company_rec.company_id 
      AND name = 'Detailed Design Control Steps'
    );
    
    -- Then standardize names for this company only
    FOR phase_rec IN 
      SELECT cp.id, cp.position, cp.name, cp.category_id
      FROM company_phases cp
      JOIN phase_categories pc ON pc.id = cp.category_id
      WHERE pc.company_id = company_rec.company_id
      AND pc.name = 'Detailed Design Control Steps'
      ORDER BY cp.position
    LOOP
      -- Generate standardized name based on position
      new_name := CASE phase_rec.position
        WHEN 1 THEN '(01) Concept & Feasibility'
        WHEN 2 THEN '(02) Design Planning'
        WHEN 3 THEN '(03) Design Input'
        WHEN 4 THEN '(04) Design Output'
        WHEN 5 THEN '(05) Verification'
        WHEN 6 THEN '(06) Validation (Design, Clinical, Usability)'
        WHEN 7 THEN '(07) Design Transfer'
        WHEN 8 THEN '(08) Design Change Control'
        WHEN 9 THEN '(09) Risk Management'
        WHEN 10 THEN '(10) Configuration Management'
        WHEN 11 THEN '(11) Technical Documentation'
        WHEN 12 THEN '(12) Clinical Evaluation'
        WHEN 13 THEN '(13) Post-Market Surveillance'
        WHEN 14 THEN '(14) Design Review'
        WHEN 15 THEN '(15) Design History File'
        ELSE phase_rec.name -- Keep existing name if position is outside 1-15
      END;
      
      -- Check if this name already exists for this company (excluding current phase)
      SELECT COUNT(*) INTO duplicate_count
      FROM company_phases cp2
      WHERE cp2.company_id = company_rec.company_id
      AND cp2.name = new_name
      AND cp2.id != phase_rec.id;
      
      -- If duplicate exists, append position number to make it unique
      IF duplicate_count > 0 THEN
        final_name := new_name || ' [' || phase_rec.position || ']';
        RAISE NOTICE 'Duplicate found for "%" - using "%"', new_name, final_name;
      ELSE
        final_name := new_name;
      END IF;
      
      -- Only update if the name is different
      IF final_name != phase_rec.name THEN
        UPDATE company_phases 
        SET name = final_name, updated_at = now()
        WHERE id = phase_rec.id;
        
        RAISE NOTICE 'Updated phase % from "%" to "%"', phase_rec.position, phase_rec.name, final_name;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed processing company: %', company_rec.company_name;
  END LOOP;
END $$;

-- Step 4: Log the migration for audit purposes
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'company_phases_system_fix_safe',
  'system_phase_identification_with_duplicate_handling',
  jsonb_build_object(
    'companies_processed', COUNT(DISTINCT pc.company_id),
    'phases_marked_as_system', COUNT(DISTINCT cp.id),
    'migration_timestamp', now(),
    'success', true,
    'action', 'safely_added_system_phase_columns_and_standardized_names',
    'duplicate_handling', 'applied_position_suffix_for_conflicts'
  ),
  now()
FROM phase_categories pc
JOIN company_phases cp ON cp.category_id = pc.id
WHERE pc.name = 'Detailed Design Control Steps';

COMMIT;
