-- Move continuous processes to "Detailed Design Control Steps" category
-- First, get the category_id for "Detailed Design Control Steps"
DO $$
DECLARE
  detailed_design_category_id uuid;
  continuous_processes_category_id uuid;
BEGIN
  -- Get the "Detailed Design Control Steps" category ID
  SELECT id INTO detailed_design_category_id
  FROM phase_categories
  WHERE name = 'Detailed Design Control Steps' AND is_system_category = true;
  
  -- Get the "Continuous Processes" category ID  
  SELECT id INTO continuous_processes_category_id
  FROM phase_categories
  WHERE name = 'Continuous Processes' AND is_system_category = true;
  
  -- Update all continuous processes to use "Detailed Design Control Steps" category
  UPDATE company_phases
  SET category_id = detailed_design_category_id
  WHERE category_id = continuous_processes_category_id
  AND is_continuous_process = true;
  
  -- Delete the now-empty "Continuous Processes" category
  DELETE FROM phase_categories
  WHERE id = continuous_processes_category_id;
  
  -- Update positions to ensure proper ordering (linear phases 1-8, continuous processes 9-12)
  UPDATE company_phases
  SET position = CASE
    WHEN name = '(C1) Risk Management' THEN 9
    WHEN name = '(C2) Configuration Management' THEN 10
    WHEN name = '(C3) Design Change Control' THEN 11
    WHEN name = '(C4) Post-Market Surveillance' THEN 12
    ELSE position
  END
  WHERE is_continuous_process = true
  AND category_id = detailed_design_category_id;
  
  RAISE NOTICE 'Successfully moved continuous processes to Detailed Design Control Steps category';
END $$;