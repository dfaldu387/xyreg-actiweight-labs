
-- Fix all EUDAMED-imported products for company ec7c2039-e4f6-4cdd-8228-982b7cee7bbd
-- 1. Clean UDI-DI from product names
-- 2. Set launch date to 3 years ago
-- 3. Set EU market as launched with CE_MARKED
-- 4. Set launch_status and current_lifecycle_phase

UPDATE products
SET
  name = regexp_replace(name, '\s*\([^)]*\)\s*$', ''),
  actual_launch_date = (CURRENT_DATE - INTERVAL '3 years')::date,
  launch_status = 'launched',
  current_lifecycle_phase = 'Post-Market Surveillance',
  markets = jsonb_build_array(
    jsonb_build_object(
      'code', 'EU',
      'name', 'European Union',
      'selected', true,
      'regulatoryStatus', 'CE_MARKED',
      'marketLaunchStatus', 'launched',
      'actualLaunchDate', to_char((CURRENT_DATE - INTERVAL '3 years')::date, 'YYYY-MM-DD')
    )
  ),
  updated_at = now()
WHERE company_id = 'ec7c2039-e4f6-4cdd-8228-982b7cee7bbd'
  AND udi_di IS NOT NULL
  AND launch_status = 'pre_launch';
