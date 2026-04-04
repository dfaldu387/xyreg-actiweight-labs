-- Fix bundle names to be unique and include product name
-- This ensures each bundle has a clear, descriptive, and unique name

DO $$
DECLARE
  bundle_record RECORD;
  product_name TEXT;
  bundle_count INTEGER;
  new_bundle_name TEXT;
BEGIN
  -- Loop through all bundles
  FOR bundle_record IN 
    SELECT pb.id, pb.company_id, pb.created_by_product_id, pb.bundle_name
    FROM product_bundles pb
    ORDER BY pb.created_at
  LOOP
    -- Get the product name if created_by_product_id exists
    IF bundle_record.created_by_product_id IS NOT NULL THEN
      SELECT p.name INTO product_name
      FROM products p
      WHERE p.id = bundle_record.created_by_product_id;
      
      IF product_name IS NOT NULL THEN
        -- Count existing bundles with this product's name prefix
        SELECT COUNT(*) INTO bundle_count
        FROM product_bundles
        WHERE company_id = bundle_record.company_id
          AND bundle_name LIKE product_name || ' Bundle %'
          AND id < bundle_record.id;
        
        -- Generate new unique name
        new_bundle_name := product_name || ' Bundle ' || (bundle_count + 1)::TEXT;
        
        -- Update the bundle
        UPDATE product_bundles
        SET bundle_name = new_bundle_name
        WHERE id = bundle_record.id;
      END IF;
    ELSE
      -- For bundles without a creator product, keep numbered but ensure uniqueness
      SELECT COUNT(*) INTO bundle_count
      FROM product_bundles
      WHERE company_id = bundle_record.company_id
        AND bundle_name LIKE 'Bundle %'
        AND id < bundle_record.id;
      
      new_bundle_name := 'Bundle ' || (bundle_count + 1)::TEXT;
      
      UPDATE product_bundles
      SET bundle_name = new_bundle_name
      WHERE id = bundle_record.id;
    END IF;
  END LOOP;
END $$;