-- Create the "Detailed Design Control Steps" category if it doesn't exist
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

-- Add the 7 new phases to the category (excluding Concept & Feasibility which already exists)
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
  ('Project Initiation & Planning', 'Project initiation, planning and resource allocation', 2),
  ('Requirements & Design Inputs', 'Requirements gathering and design input specifications', 3),
  ('Design & Development (Output)', 'Design development and output creation', 4),
  ('Verification & Validation (V&V)', 'Verification and validation activities', 5),
  ('Finalization & Transfer', 'Design finalization and transfer to production', 6),
  ('Regulatory Submission & Approval', 'Regulatory submission and approval processes', 7),
  ('Launch & Post-Launch', 'Product launch and post-launch monitoring', 8)
) AS new_phases(phase_name, phase_description, phase_position)
WHERE NOT EXISTS (
  SELECT 1 FROM company_phases cp
  JOIN genis_company gc ON cp.company_id = gc.company_id
  WHERE cp.name = phase_name
);