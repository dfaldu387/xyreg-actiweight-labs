-- Create the "Detailed Design Control Steps" category
INSERT INTO phase_categories (name, description, position, company_id, is_custom)
SELECT 
  'Detailed Design Control Steps',
  'Sequential phases for detailed design control process',
  0,
  c.id,
  true
FROM companies c
WHERE c.name = 'Genis'
ON CONFLICT (company_id, name) DO NOTHING;

-- Get the category ID for Genis company
WITH genis_company AS (
  SELECT id as company_id FROM companies WHERE name = 'Genis'
),
category_info AS (
  SELECT pc.id as category_id, gc.company_id
  FROM phase_categories pc
  JOIN genis_company gc ON pc.company_id = gc.company_id
  WHERE pc.name = 'Detailed Design Control Steps'
)

-- Update and rename existing phases to match requirements
UPDATE company_phases SET
  name = CASE 
    WHEN name = 'Design Input' THEN 'Requirements & Design Inputs'
    WHEN name = 'Design Output' THEN 'Design & Development (Output)'
    WHEN name = 'Design Transfer' THEN 'Finalization & Transfer'
    WHEN name = 'Post Market Surveillance' THEN 'Launch & Post-Launch'
    WHEN name = 'Verification' THEN 'Verification & Validation (V&V)'
    ELSE name
  END,
  category_id = (SELECT category_id FROM category_info),
  position = CASE 
    WHEN name = 'Project Initiation & Planning' THEN 2
    WHEN name = 'Design Input' THEN 3
    WHEN name = 'Design Output' THEN 4
    WHEN name = 'Verification' THEN 5
    WHEN name = 'Design Transfer' THEN 6
    WHEN name = 'Post Market Surveillance' THEN 8
    ELSE position
  END
WHERE company_id = (SELECT company_id FROM genis_company)
AND name IN ('Design Input', 'Design Output', 'Design Transfer', 'Post Market Surveillance', 'Verification', 'Project Initiation & Planning');

-- Create missing phases
WITH genis_company AS (
  SELECT id as company_id FROM companies WHERE name = 'Genis'
),
category_info AS (
  SELECT pc.id as category_id
  FROM phase_categories pc
  JOIN genis_company gc ON pc.company_id = gc.company_id
  WHERE pc.name = 'Detailed Design Control Steps'
)

INSERT INTO company_phases (name, description, position, company_id, category_id, is_active, is_custom)
SELECT 
  phase_name,
  phase_description,
  phase_position,
  (SELECT company_id FROM genis_company),
  (SELECT category_id FROM category_info),
  true,
  true
FROM (VALUES
  ('Concept & Feasibility', 'Initial concept development and feasibility assessment', 1),
  ('Regulatory Submission & Approval', 'Regulatory submission and approval processes', 7)
) AS new_phases(phase_name, phase_description, phase_position)
WHERE NOT EXISTS (
  SELECT 1 FROM company_phases cp
  JOIN genis_company gc ON cp.company_id = gc.company_id
  WHERE cp.name = phase_name
);

-- Remove duplicate Validation phase (keep the renamed Verification & Validation)
DELETE FROM company_phases 
WHERE company_id = (SELECT id FROM companies WHERE name = 'Genis')
AND name = 'Validation (Design, Clinical, Usability)';

-- Update remaining continuous process phases to have appropriate categories/positions
UPDATE company_phases SET
  position = CASE 
    WHEN name = 'Risk Management (Continuous)' THEN 100
    WHEN name = 'Supplier Management (Continuous)' THEN 101
    WHEN name = 'Technical Documentation (Continuous)' THEN 102
    WHEN name = 'Design Change Control' THEN 103
    ELSE position
  END
WHERE company_id = (SELECT id FROM companies WHERE name = 'Genis')
AND name IN ('Risk Management (Continuous)', 'Supplier Management (Continuous)', 'Technical Documentation (Continuous)', 'Design Change Control');