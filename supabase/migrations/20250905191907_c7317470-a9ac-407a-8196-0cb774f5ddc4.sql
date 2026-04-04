-- Restore company chosen phases for the fixed positions
-- First, let's get the phase IDs and restore the company_chosen_phases
INSERT INTO company_chosen_phases (company_id, phase_id, position)
SELECT 
  '2ca71587-6db0-4d4b-9308-e987a9d9c1d8' as company_id,
  cp.id as phase_id,
  CASE cp.name
    WHEN 'Concept & Feasibility' THEN 0
    WHEN 'Project Initiation & Planning' THEN 1  
    WHEN 'Design Input' THEN 2
    WHEN 'Design Output' THEN 3
    WHEN 'Verification' THEN 4
    WHEN 'Validation (Design, Clinical, Usability)' THEN 5
    WHEN 'Design Transfer' THEN 6
    WHEN 'Design Change Control' THEN 7
    WHEN 'Risk Management (Continuous)' THEN 100
    WHEN 'Technical Documentation (Continuous)' THEN 101
    WHEN 'Supplier Management (Continuous)' THEN 102
    ELSE 999
  END as position
FROM company_phases cp
WHERE cp.company_id = '2ca71587-6db0-4d4b-9308-e987a9d9c1d8'
  AND cp.name IN (
    'Concept & Feasibility',
    'Project Initiation & Planning',
    'Design Input', 
    'Design Output',
    'Verification',
    'Validation (Design, Clinical, Usability)',
    'Design Transfer',
    'Design Change Control',
    'Risk Management (Continuous)',
    'Technical Documentation (Continuous)',
    'Supplier Management (Continuous)'
  )
ON CONFLICT (company_id, phase_id) DO UPDATE SET
  position = EXCLUDED.position;