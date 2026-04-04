
-- Safe migration to update existing companies to use "Detailed Design Control Steps" system phases
-- This migration safely handles existing phases and prevents duplicate key violations

BEGIN;

-- Step 1: Update category names from "Design Control" to "Detailed Design Control Steps"
UPDATE phase_categories 
SET name = 'Detailed Design Control Steps'
WHERE name = 'Design Control';

-- Step 2: Create a temporary function to safely update phases
CREATE OR REPLACE FUNCTION safe_update_company_phases()
RETURNS void AS $$
DECLARE
  company_rec RECORD;
  phase_rec RECORD;
  category_id uuid;
  new_name text;
  new_description text;
BEGIN
  -- Process each company with "Detailed Design Control Steps" category
  FOR company_rec IN 
    SELECT DISTINCT c.id as company_id, c.name as company_name
    FROM companies c
    JOIN phase_categories pc ON pc.company_id = c.id
    WHERE pc.name = 'Detailed Design Control Steps'
    AND c.is_archived = false
  LOOP
    -- Get the category ID for this company
    SELECT id INTO category_id
    FROM phase_categories 
    WHERE company_id = company_rec.company_id 
    AND name = 'Detailed Design Control Steps'
    LIMIT 1;
    
    -- Process each phase position (1-15)
    FOR i IN 1..15 LOOP
      -- Determine the standardized name and description
      new_name := CASE i
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
      END;
      
      new_description := CASE i
        WHEN 1 THEN 'Initial concept development and feasibility assessment'
        WHEN 2 THEN 'Planning and preparation for design activities'
        WHEN 3 THEN 'Definition of design requirements and inputs'
        WHEN 4 THEN 'Creation of design outputs and specifications'
        WHEN 5 THEN 'Verification that design outputs meet design inputs'
        WHEN 6 THEN 'Validation of the design under actual use conditions'
        WHEN 7 THEN 'Transfer of design to manufacturing'
        WHEN 8 THEN 'Management of design changes throughout lifecycle'
        WHEN 9 THEN 'Ongoing risk assessment and management'
        WHEN 10 THEN 'Management of design configuration and versions'
        WHEN 11 THEN 'Creation and maintenance of technical documentation'
        WHEN 12 THEN 'Clinical assessment and evaluation activities'
        WHEN 13 THEN 'Ongoing monitoring and surveillance activities'
        WHEN 14 THEN 'Systematic reviews of design at key stages'
        WHEN 15 THEN 'Compilation and maintenance of design history documentation'
      END;
      
      -- Check if a phase at this position exists for this company
      SELECT * INTO phase_rec
      FROM company_phases 
      WHERE company_id = company_rec.company_id 
      AND position = i
      AND category_id = category_id
      LIMIT 1;
      
      IF FOUND THEN
        -- Update existing phase if name is different
        IF phase_rec.name != new_name THEN
          UPDATE company_phases 
          SET 
            name = new_name,
            description = new_description,
            is_active = true,
            updated_at = now()
          WHERE id = phase_rec.id;
          
          RAISE NOTICE 'Updated phase % for company % from "%" to "%"', i, company_rec.company_name, phase_rec.name, new_name;
        END IF;
      ELSE
        -- Create missing phase
        INSERT INTO company_phases (
          company_id,
          name,
          description,
          position,
          category_id,
          is_active
        ) VALUES (
          company_rec.company_id,
          new_name,
          new_description,
          i,
          category_id,
          true
        );
        
        -- Add to company_chosen_phases
        INSERT INTO company_chosen_phases (company_id, phase_id, position)
        VALUES (company_rec.company_id, lastval(), i);
        
        RAISE NOTICE 'Created missing phase % for company %: "%"', i, company_rec.company_name, new_name;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the safe update function
SELECT safe_update_company_phases();

-- Clean up the function
DROP FUNCTION safe_update_company_phases();

-- Step 3: Update phases table to mark as system phases
UPDATE phases 
SET 
  is_predefined_core_phase = true,
  is_custom = false,
  is_deletable = false
WHERE category_id IN (
  SELECT id FROM phase_categories 
  WHERE name = 'Detailed Design Control Steps'
);

-- Step 4: Log the migration for audit purposes
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'detailed_design_control_safe_migration',
  'system_phase_conversion',
  jsonb_build_object(
    'companies_with_category', COUNT(DISTINCT pc.company_id),
    'categories_updated', COUNT(DISTINCT pc.id),
    'migration_timestamp', now(),
    'success', true,
    'method', 'safe_update_with_duplicate_handling'
  ),
  now()
FROM phase_categories pc
WHERE pc.name = 'Detailed Design Control Steps';

COMMIT;
