-- Fix category assignments and initialize phases for all affected companies
DO $$
DECLARE
  company_record RECORD;
  category_record RECORD;
  phase_record RECORD;
  position_counter INTEGER;
BEGIN
  -- Step 1: Fix category assignments for continuous processes
  RAISE NOTICE 'Fixing category assignments for continuous processes...';
  
  FOR company_record IN 
    SELECT id, name FROM companies WHERE is_archived = false
  LOOP
    -- Get the correct category for this company
    SELECT id INTO category_record.id
    FROM phase_categories
    WHERE company_id = company_record.id
    AND name = 'Detailed Design Control Steps'
    AND is_system_category = true;
    
    IF category_record.id IS NOT NULL THEN
      -- Update any continuous processes that have wrong category assignments
      UPDATE company_phases
      SET category_id = category_record.id
      WHERE company_id = company_record.id
      AND is_continuous_process = true
      AND (category_id IS NULL OR category_id != category_record.id);
      
      -- Also update linear phases to ensure they have correct category
      UPDATE company_phases
      SET category_id = category_record.id
      WHERE company_id = company_record.id
      AND is_continuous_process = false
      AND (category_id IS NULL OR category_id != category_record.id);
      
      RAISE NOTICE 'Fixed category assignments for company: %', company_record.name;
    END IF;
  END LOOP;
  
  -- Step 2: Initialize chosen phases for companies with 0 chosen phases
  RAISE NOTICE 'Initializing chosen phases for companies with missing phases...';
  
  FOR company_record IN 
    SELECT c.id, c.name 
    FROM companies c
    LEFT JOIN company_chosen_phases ccp ON ccp.company_id = c.id
    WHERE c.is_archived = false
    GROUP BY c.id, c.name
    HAVING COUNT(ccp.id) = 0
  LOOP
    position_counter := 1;
    
    -- Add linear phases first (positions 1-8)
    FOR phase_record IN 
      SELECT id, name, position
      FROM company_phases
      WHERE company_id = company_record.id
      AND is_continuous_process = false
      ORDER BY position
    LOOP
      INSERT INTO company_chosen_phases (company_id, phase_id, position)
      VALUES (company_record.id, phase_record.id, position_counter);
      position_counter := position_counter + 1;
    END LOOP;
    
    -- Then add continuous processes (positions 9-12)
    FOR phase_record IN 
      SELECT id, name, position
      FROM company_phases
      WHERE company_id = company_record.id
      AND is_continuous_process = true
      ORDER BY position
    LOOP
      INSERT INTO company_chosen_phases (company_id, phase_id, position)
      VALUES (company_record.id, phase_record.id, position_counter);
      position_counter := position_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Initialized % chosen phases for company: %', position_counter - 1, company_record.name;
  END LOOP;
  
  RAISE NOTICE 'Category assignments and phase initialization completed for all companies';
END $$;