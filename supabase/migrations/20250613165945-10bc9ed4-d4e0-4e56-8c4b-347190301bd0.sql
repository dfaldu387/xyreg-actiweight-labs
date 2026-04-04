
-- First, let's check if there are any constraints or triggers causing this issue
-- and create a more permissive constraint that allows numbered and non-numbered phases to coexist

-- Remove any existing constraints that might be causing conflicts
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_company_id_name_key;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS unique_phase_name_per_company;

-- Create a new constraint that allows exact name matches only
-- This will allow "(07) Validation" and "Validation" to coexist
ALTER TABLE phases ADD CONSTRAINT phases_exact_name_per_company UNIQUE (company_id, name);

-- Also check if there are any triggers that might be normalizing names
-- If there are any triggers on phases table that modify the name before insert/update, we may need to disable them temporarily
