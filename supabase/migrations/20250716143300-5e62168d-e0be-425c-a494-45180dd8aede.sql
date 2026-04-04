-- Remove "Test Phase" and "Detailed Design Control Steps" from all companies

-- First, remove any company_chosen_phases references
DELETE FROM company_chosen_phases 
WHERE phase_id IN (
  SELECT id FROM company_phases 
  WHERE name IN ('Test Phase', 'Detailed Design Control Steps')
);

-- Then remove the phases themselves
DELETE FROM company_phases 
WHERE name IN ('Test Phase', 'Detailed Design Control Steps');