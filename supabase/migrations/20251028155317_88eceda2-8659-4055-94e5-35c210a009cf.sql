-- Create a model for "Nox RIP Belts Disposable" product family
INSERT INTO company_product_models (
  company_id,
  name,
  description,
  basic_udi_di,
  is_active,
  variant_count
)
SELECT 
  company_id,
  'Nox RIP Belts Disposable' as name,
  'Disposable RIP (Respiratory Inductance Plethysmography) belts for respiratory monitoring' as description,
  '1569431111NOX_RIPBELTS6W' as basic_udi_di,
  true as is_active,
  10 as variant_count
FROM products
WHERE basic_udi_di = '1569431111NOX_RIPBELTS6W'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Link all "Nox RIP Belts Disposable" products to the model
UPDATE products
SET 
  model_id = (
    SELECT id 
    FROM company_product_models 
    WHERE basic_udi_di = '1569431111NOX_RIPBELTS6W'
    LIMIT 1
  ),
  is_variant = true,
  variant_sequence = CASE
    WHEN name = 'Nox RIP Belts Disposable' THEN 1
    WHEN name = 'Nox RIP Belts Disposable (2)' THEN 2
    WHEN name = 'Nox RIP Belts Disposable (3)' THEN 3
    WHEN name = 'Nox RIP Belts Disposable (4)' THEN 4
    WHEN name = 'Nox RIP Belts Disposable (5)' THEN 5
    WHEN name = 'Nox RIP Belts Disposable (6)' THEN 6
    WHEN name = 'Nox RIP Belts Disposable (7)' THEN 7
    WHEN name = 'Nox RIP Belts Disposable (8)' THEN 8
    WHEN name = 'Nox RIP Belts Disposable (9)' THEN 9
    WHEN name = 'Nox RIP Belts Disposable (10)' THEN 10
    ELSE NULL
  END
WHERE basic_udi_di = '1569431111NOX_RIPBELTS6W'
AND is_archived = false;