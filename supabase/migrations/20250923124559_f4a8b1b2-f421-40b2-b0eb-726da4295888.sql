-- Delete existing incomplete FDA items and regenerate all 56 items
-- First, delete existing FDA items for Heena Test company
DELETE FROM gap_analysis_items 
WHERE framework = 'FDA_21_CFR_820';

-- Now insert all 56 FDA template items as company-wide gap analysis items
INSERT INTO gap_analysis_items (
  template_item_id,
  framework,
  section,
  requirement,
  description,
  category,
  status,
  created_at,
  updated_at,
  product_id  -- This will be NULL for company-wide items
)
SELECT 
  gti.id,
  gti.framework,
  gti.section,
  gti.requirement,
  gti.description,
  gti.category,
  'not_started',
  now(),
  now(),
  NULL  -- Company-wide items have NULL product_id
FROM gap_template_items gti
WHERE gti.template_id = 'a686bb1a-398c-46af-8b3a-0fdcfa201a8e'  -- FDA template ID
ORDER BY gti.section, gti.requirement;