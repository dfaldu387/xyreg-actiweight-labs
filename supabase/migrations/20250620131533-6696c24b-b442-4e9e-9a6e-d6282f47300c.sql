
-- Add unique constraint to prevent duplicate product names within the same company
-- This migration ensures data integrity at the database level

-- First, let's identify and handle any existing duplicates
-- We'll add a suffix to existing duplicates to make them unique
WITH duplicate_products AS (
  SELECT 
    id,
    name,
    company_id,
    ROW_NUMBER() OVER (PARTITION BY company_id, name ORDER BY inserted_at) as rn
  FROM products 
  WHERE NOT is_archived
),
products_to_update AS (
  SELECT 
    id,
    name || ' (' || rn || ')' as new_name
  FROM duplicate_products 
  WHERE rn > 1
)
UPDATE products 
SET name = products_to_update.new_name
FROM products_to_update 
WHERE products.id = products_to_update.id;

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE products 
ADD CONSTRAINT unique_product_name_per_company 
UNIQUE (company_id, name);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT unique_product_name_per_company ON products IS 
'Ensures each company cannot have products with identical names';
