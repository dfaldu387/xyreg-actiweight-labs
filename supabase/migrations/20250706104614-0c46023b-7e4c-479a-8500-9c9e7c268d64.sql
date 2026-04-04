
-- First, let's check the current foreign key constraint
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
  AND tc.table_name='lifecycle_phases' 
  AND kcu.column_name='phase_id';

-- Drop the existing foreign key constraint that references the old phases table
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS fk_lifecycle_phases_phase_id;
ALTER TABLE lifecycle_phases DROP CONSTRAINT IF EXISTS lifecycle_phases_phase_id_fkey;

-- Create new foreign key constraint that references company_phases table
ALTER TABLE lifecycle_phases 
ADD CONSTRAINT fk_lifecycle_phases_phase_id 
FOREIGN KEY (phase_id) REFERENCES company_phases(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_phase_id ON lifecycle_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_phases_product_phase ON lifecycle_phases(product_id, phase_id);
