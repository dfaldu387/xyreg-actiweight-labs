
-- Fix document phase ID inconsistency: Update documents to use lifecycle phase IDs
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
),
document_fixes AS (
  SELECT 
    d.id as document_id,
    d.phase_id as current_phase_id,
    pm.lifecycle_phase_id as correct_phase_id,
    d.product_id,
    pm.phase_name
  FROM documents d
  JOIN phase_mapping pm ON d.phase_id = pm.company_phase_id 
    AND d.product_id = pm.product_id
  WHERE d.product_id IS NOT NULL
    AND d.phase_id = pm.company_phase_id
)
UPDATE documents 
SET phase_id = df.correct_phase_id
FROM document_fixes df
WHERE documents.id = df.document_id;

-- Verify the fix by checking document counts per phase
SELECT 
  lp.name as phase_name,
  COUNT(d.id) as document_count,
  lp.product_id
FROM lifecycle_phases lp
LEFT JOIN documents d ON d.phase_id = lp.id
WHERE lp.product_id = '6105e08c-4bd3-4863-ae86-8e4069c6ca6c'
GROUP BY lp.id, lp.name, lp.product_id
ORDER BY lp.name;
