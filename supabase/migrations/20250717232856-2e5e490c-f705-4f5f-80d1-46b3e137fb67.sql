-- Create gap analysis items for MDR Annex I template for the specific product
INSERT INTO gap_analysis_items (
  product_id,
  requirement,
  section,
  clause_id,
  clause_summary,
  category,
  framework,
  status,
  priority
)
SELECT 
  '6105e08c-4bd3-4863-ae86-8e4069c6ca6c'::uuid as product_id,
  gti.requirement_text as requirement,
  gti.clause_reference as section,
  gti.item_number as clause_id,
  gti.requirement_text as clause_summary,
  gti.category,
  'MDR_ANNEX_I' as framework,
  'not_started' as status,
  COALESCE(gti.priority, 'medium') as priority
FROM gap_analysis_templates gat
JOIN gap_template_items gti ON gti.template_id = gat.id
WHERE gat.framework = 'MDR_ANNEX_I'
  AND gat.id = '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75'
ORDER BY gti.sort_order;