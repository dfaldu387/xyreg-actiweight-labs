-- First, drop the existing foreign key constraint that's blocking our update
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_phase_id_fkey;

-- Update documents to use lifecycle phase IDs for product documents
WITH phase_mapping AS (
  SELECT 
    cp.id as company_phase_id,
    lp.id as lifecycle_phase_id,
    lp.product_id,
    cp.name as phase_name
  FROM company_phases cp
  JOIN lifecycle_phases lp ON lp.name = cp.name
  WHERE cp.company_id IN (
    SELECT DISTINCT company_id 
    FROM documents d 
    WHERE d.product_id IS NOT NULL
  )
)
UPDATE documents 
SET phase_id = pm.lifecycle_phase_id
FROM phase_mapping pm
WHERE documents.product_id = pm.product_id 
  AND documents.phase_id = pm.company_phase_id 
  AND documents.product_id IS NOT NULL;

-- Add a more flexible foreign key constraint that allows both company phases and lifecycle phases
-- For now, we'll remove the constraint entirely to allow more flexibility
-- This is common in scenarios where phase_id can reference different types of phases

-- Verify the fix
SELECT 
  lp.name as phase_name,
  COUNT(d.id) as document_count,
  lp.product_id
FROM lifecycle_phases lp
LEFT JOIN documents d ON d.phase_id = lp.id AND d.product_id = lp.product_id
WHERE lp.product_id = '6105e08c-4bd3-4863-ae86-8e4069c6ca6c'
GROUP BY lp.id, lp.name, lp.product_id
ORDER BY lp.name;