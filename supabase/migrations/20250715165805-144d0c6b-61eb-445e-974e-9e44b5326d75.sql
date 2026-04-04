-- Clean up duplicate phases and fix standard phase flags (fixed approach)

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

-- 3. Update is_predefined_core_phase flag for all numbered phases (01-15)
UPDATE company_phases 
SET is_predefined_core_phase = true
WHERE name ~ '^\([0-9]{1,2}\)' -- Matches phases starting with (1), (01), (02), etc.
AND is_predefined_core_phase = false;

-- 4. Fix position conflicts by temporarily setting high positions, then correct them
-- First, set all numbered phases to high temporary positions to avoid conflicts
UPDATE company_phases 
SET position = position + 1000
WHERE name ~ '^\([0-9]{1,2}\)' 
AND is_predefined_core_phase = true;

-- Now set the correct positions based on the numeric prefix
UPDATE company_phases 
SET position = CAST(substring(name from '^\(([0-9]{1,2})\)') AS INTEGER)
WHERE name ~ '^\([0-9]{1,2}\)' 
AND is_predefined_core_phase = true;