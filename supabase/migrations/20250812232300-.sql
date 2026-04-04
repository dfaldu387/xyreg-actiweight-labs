-- Fix Widex A/S duplicate companies issue
-- Move all products from smaller company to larger company and handle any conflicts

DO $$
DECLARE
  smaller_company_id uuid := '8d4df0fe-a07d-48d1-8784-a0f2014de7ec';
  larger_company_id uuid := 'c9378621-7f1e-468e-8f99-d89a46a708d4';
  product_record RECORD;
  conflict_count INTEGER := 0;
BEGIN
  -- Log the operation
  RAISE NOTICE 'Starting Widex A/S company merge operation';
  RAISE NOTICE 'Moving products from company % to company %', smaller_company_id, larger_company_id;
  
  -- Handle each product from the smaller company
  FOR product_record IN 
    SELECT * FROM products 
    WHERE company_id = smaller_company_id AND is_archived = false
  LOOP
    -- Check if a product with the same name exists in the target company
    IF EXISTS (
      SELECT 1 FROM products 
      WHERE company_id = larger_company_id 
        AND name = product_record.name 
        AND is_archived = false
    ) THEN
      -- Handle conflict by renaming the product being moved
      conflict_count := conflict_count + 1;
      RAISE NOTICE 'Conflict detected for product: %. Renaming...', product_record.name;
      
      UPDATE products 
      SET 
        company_id = larger_company_id,
        name = product_record.name || ' (Merged #' || conflict_count || ')',
        updated_at = now()
      WHERE id = product_record.id;
      
    ELSE
      -- No conflict, move directly
      UPDATE products 
      SET 
        company_id = larger_company_id,
        updated_at = now()
      WHERE id = product_record.id;
    END IF;
  END LOOP;
  
  -- Move any user access records
  UPDATE user_company_access 
  SET company_id = larger_company_id
  WHERE company_id = smaller_company_id
    AND NOT EXISTS (
      SELECT 1 FROM user_company_access uca2 
      WHERE uca2.company_id = larger_company_id 
        AND uca2.user_id = user_company_access.user_id
    );
  
  -- Delete duplicate user access records for the smaller company
  DELETE FROM user_company_access 
  WHERE company_id = smaller_company_id;
  
  -- Archive the smaller company
  UPDATE companies 
  SET 
    is_archived = true,
    archived_at = now(),
    name = name || ' (Archived Duplicate)'
  WHERE id = smaller_company_id;
  
  RAISE NOTICE 'Merge completed. Moved products with % conflicts resolved', conflict_count;
END $$;