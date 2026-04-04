
-- Remove all duplicate UNIQUE constraints on phases table (company_id, name)
-- Keep only our new constraint that allows exact name matching

-- Remove the old conflicting constraints
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_company_name_unique;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS unique_company_phase_name;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_company_id_name_key;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS unique_phase_name_per_company;

-- First drop our constraint if it exists, then recreate it
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_exact_name_per_company;

-- Create the exact name constraint (without IF NOT EXISTS which isn't supported)
ALTER TABLE phases ADD CONSTRAINT phases_exact_name_per_company UNIQUE (company_id, name);
