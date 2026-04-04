-- Link all Nox RIP Belts Disposable products to their existing model
DO $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Get the existing model ID
  SELECT id INTO v_model_id
  FROM company_product_models
  WHERE name = 'Nox RIP Belts Disposable'
  AND company_id = (
    SELECT company_id 
    FROM products 
    WHERE basic_udi_di = '1569431111NOX_RIPBELTS6W' 
    LIMIT 1
  );

  -- Link all products to this model
  UPDATE products
  SET 
    model_id = v_model_id,
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
END $$;