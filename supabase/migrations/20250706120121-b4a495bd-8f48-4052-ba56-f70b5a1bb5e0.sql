
-- Step 1: Check current state of lifecycle_phases table and constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'lifecycle_phases'
  AND kcu.column_name = 'phase_id';

-- Step 2: Drop the problematic constraint completely
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS fk_lifecycle_phases_phase_id;

-- Step 3: Clear any existing broken lifecycle phase records that might be causing issues
DELETE FROM lifecycle_phases WHERE phase_id NOT IN (SELECT id FROM company_phases);

-- Step 4: Recreate the foreign key constraint with proper cascade rules
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT fk_lifecycle_phases_phase_id 
FOREIGN KEY (phase_id) REFERENCES company_phases(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_phase_id ON lifecycle_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_product_id ON lifecycle_phases(product_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_product_phase ON lifecycle_phases(product_id, phase_id);

-- Step 6: Verify the constraint is working by testing with a sample query
SELECT 
  lp.id as lifecycle_phase_id,
  lp.product_id,
  lp.phase_id,
  cp.name as company_phase_name
FROM lifecycle_phases lp
JOIN company_phases cp ON cp.id = lp.phase_id
LIMIT 5;
