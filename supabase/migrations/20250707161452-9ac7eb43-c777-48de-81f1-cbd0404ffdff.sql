-- Fix phase validation error by cleaning up duplicate foreign key relationships
-- Step 1: Check and consolidate data - ensure phase_id has all necessary data
UPDATE lifecycle_phases 
SET phase_id = company_phase_id 
WHERE phase_id IS NULL AND company_phase_id IS NOT NULL;

-- Step 2: Remove any foreign key constraints on company_phase_id
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS fk_lifecycle_phases_company_phase_id;
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS lifecycle_phases_company_phase_id_fkey;

-- Step 3: Remove any unique constraints involving company_phase_id  
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS unique_product_company_phase;
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS lifecycle_phases_product_id_company_phase_id_key;

-- Step 4: Remove the redundant company_phase_id column completely
ALTER TABLE lifecycle_phases DROP COLUMN IF EXISTS company_phase_id;

-- Step 5: Ensure we have the correct foreign key constraint on phase_id
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS fk_lifecycle_phases_phase_id;
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT fk_lifecycle_phases_phase_id 
FOREIGN KEY (phase_id) REFERENCES company_phases(id) ON DELETE CASCADE;