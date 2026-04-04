-- Step 1: Fix the positions in company_chosen_phases for correct phase ordering
UPDATE company_chosen_phases 
SET position = CASE 
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Concept & Feasibility'
  ) THEN 0
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Project Initiation & Planning'
  ) THEN 1
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Design Input'
  ) THEN 2
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Design Output'
  ) THEN 3
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Verification'
  ) THEN 4
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Validation (Design, Clinical, Usability)'
  ) THEN 5
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Design Transfer'
  ) THEN 6
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Design Change Control'
  ) THEN 7
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Risk Management (Continuous)'
  ) THEN 100
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Technical Documentation (Continuous)'
  ) THEN 101
  WHEN phase_id IN (
    SELECT id FROM company_phases 
    WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' 
    AND name = 'Supplier Management (Continuous)'
  ) THEN 102
  ELSE position
END
WHERE company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8';

-- Step 2: Delete existing incorrect lifecycle phases for the product to regenerate them
DELETE FROM lifecycle_phases 
WHERE product_id = '9e794e95-ecfe-4e6b-8b9b-ae371c16b272';