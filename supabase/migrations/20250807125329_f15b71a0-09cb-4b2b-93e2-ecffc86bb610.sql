-- Fix System or Procedure Pack characteristic persistence
UPDATE products 
SET key_technology_characteristics = jsonb_set(
  COALESCE(key_technology_characteristics, '{}'),
  '{isSystemOrProcedurePack}',
  'true'
) 
WHERE id = '562a1cb7-085a-4050-9363-52229e77410e' 
AND primary_regulatory_type = 'System or Procedure Pack';