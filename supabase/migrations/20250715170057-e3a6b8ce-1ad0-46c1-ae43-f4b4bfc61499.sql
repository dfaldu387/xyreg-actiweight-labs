-- Simple cleanup: remove duplicate and rename Design Planning

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