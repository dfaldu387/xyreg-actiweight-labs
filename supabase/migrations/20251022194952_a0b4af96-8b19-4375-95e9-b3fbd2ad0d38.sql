-- First, check and fix the unique constraints
DO $$
BEGIN
  -- Drop existing bad constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_sibling_group_in_bundle') THEN
    ALTER TABLE product_bundle_members DROP CONSTRAINT unique_sibling_group_in_bundle;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_in_bundle') THEN
    ALTER TABLE product_bundle_members DROP CONSTRAINT unique_product_in_bundle;
  END IF;
  
  -- Drop existing indexes
  DROP INDEX IF EXISTS unique_product_in_bundle_idx;
  DROP INDEX IF EXISTS unique_sibling_group_in_bundle_idx;
END $$;

-- Create proper unique indexes that handle NULLs correctly
CREATE UNIQUE INDEX unique_product_in_bundle_idx 
  ON product_bundle_members(bundle_id, product_id) 
  WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX unique_sibling_group_in_bundle_idx 
  ON product_bundle_members(bundle_id, sibling_group_id) 
  WHERE sibling_group_id IS NOT NULL;