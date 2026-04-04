-- Complete cleanup and regeneration of gap analysis items
-- This migration fixes the duplication issue by starting fresh

-- 1. Delete ALL existing company-wide ISO_13485 gap analysis items
DELETE FROM gap_analysis_items 
WHERE product_id IS NULL 
AND framework IN ('ISO_13485', 'ISO 13485');

-- 2. Regenerate gap analysis items from the enabled template
-- Insert exactly 65 items from the 65-item template
INSERT INTO gap_analysis_items (
  product_id,
  requirement,
  framework,
  section,
  clause_id,
  clause_summary,
  category,
  status,
  priority,
  action_needed,
  created_at,
  updated_at
)
SELECT 
  NULL as product_id,
  gti.requirement_text as requirement,
  'ISO_13485' as framework,
  gti.clause_reference as section,
  gti.item_number as clause_id,
  gti.requirement_text as clause_summary,
  gti.category,
  'non_compliant' as status,
  gti.priority,
  '' as action_needed,
  now() as created_at,
  now() as updated_at
FROM gap_template_items gti
JOIN gap_analysis_templates gat ON gat.id = gti.template_id
JOIN company_gap_templates cgt ON cgt.template_id = gat.id
WHERE cgt.company_id = (SELECT id FROM companies WHERE name = 'Genis')
AND cgt.is_enabled = true
AND gat.id = '550e8400-e29b-41d4-a716-446655440065';

-- 3. Add unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_company_gap_analysis_items 
ON gap_analysis_items (framework, clause_id, requirement) 
WHERE product_id IS NULL;