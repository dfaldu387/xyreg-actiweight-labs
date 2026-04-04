
-- Fix the phase naming constraint to allow exact name matching
-- This addresses the issue where "(01) Concept & Feasibility" conflicts with "Concept & Feasibility"

-- First, let's see what constraints exist on the phases table
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'phases'::regclass;

-- Remove any existing problematic constraints that might be doing name cleaning
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_company_name_unique;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS unique_company_phase_name;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_company_id_name_key;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS unique_phase_name_per_company;
ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_exact_name_per_company;

-- Also check company_phases table
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS company_phases_company_name_unique;
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS unique_company_phase_name;
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS company_phases_company_id_name_key;
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS unique_phase_name_per_company;
ALTER TABLE company_phases DROP CONSTRAINT IF EXISTS company_phases_exact_name_per_company;

-- Create a new constraint that allows exact name matching without cleaning
-- This will allow both "Concept & Feasibility" and "(01) Concept & Feasibility" to coexist
ALTER TABLE phases ADD CONSTRAINT phases_exact_name_per_company UNIQUE (company_id, name);
ALTER TABLE company_phases ADD CONSTRAINT company_phases_exact_name_per_company UNIQUE (company_id, name);

-- Check if there are any triggers that might be modifying phase names
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table IN ('phases', 'company_phases');
