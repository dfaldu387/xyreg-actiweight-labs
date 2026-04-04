-- Fix Widex duplicate company issue
-- Step 1: Handle duplicate product names within the same company by adding suffix
WITH duplicate_products AS (
  SELECT 
    company_id,
    name,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at ASC) as product_ids
  FROM products 
  WHERE company_id IN (
    SELECT id FROM companies 
    WHERE name ILIKE '%Widex A/S%' 
      AND srn = 'DK-MF-000025153'
      AND is_archived = false
  )
  AND is_archived = false
  GROUP BY company_id, name
  HAVING COUNT(*) > 1
)
UPDATE products 
SET name = products.name || ' (v' || (
  SELECT (row_number() OVER (PARTITION BY dp.company_id, dp.name ORDER BY products.created_at ASC))::text
  FROM duplicate_products dp
  WHERE dp.company_id = products.company_id 
    AND dp.name = products.name
    AND products.id = ANY(dp.product_ids)
) || ')'
WHERE id IN (
  SELECT unnest(product_ids[2:]) -- Skip first product, rename the rest
  FROM duplicate_products
);

-- Step 2: Identify the two Widex companies and move products from smaller to larger
WITH widex_companies AS (
  SELECT 
    id, 
    name, 
    srn,
    (SELECT COUNT(*) FROM products WHERE company_id = companies.id AND is_archived = false) as product_count
  FROM companies 
  WHERE name ILIKE '%Widex A/S%' 
    AND srn = 'DK-MF-000025153'
    AND is_archived = false
),
target_companies AS (
  SELECT 
    id,
    product_count,
    ROW_NUMBER() OVER (ORDER BY product_count DESC) as rn
  FROM widex_companies
)
-- Move all products from smaller company to larger company
UPDATE products 
SET company_id = (
  SELECT id FROM target_companies WHERE rn = 1
)
WHERE company_id = (
  SELECT id FROM target_companies WHERE rn = 2
)
AND is_archived = false;

-- Step 3: Move user access records from smaller to larger company
WITH widex_companies AS (
  SELECT 
    id, 
    name, 
    srn,
    (SELECT COUNT(*) FROM products WHERE company_id = companies.id AND is_archived = false) as product_count
  FROM companies 
  WHERE name ILIKE '%Widex A/S%' 
    AND srn = 'DK-MF-000025153'
    AND is_archived = false
),
target_companies AS (
  SELECT 
    id,
    product_count,
    ROW_NUMBER() OVER (ORDER BY product_count DESC) as rn
  FROM widex_companies
)
UPDATE user_company_access 
SET company_id = (
  SELECT id FROM target_companies WHERE rn = 1
)
WHERE company_id = (
  SELECT id FROM target_companies WHERE rn = 2
)
AND NOT EXISTS (
  -- Avoid duplicate access records
  SELECT 1 FROM user_company_access uca2 
  WHERE uca2.user_id = user_company_access.user_id 
    AND uca2.company_id = (SELECT id FROM target_companies WHERE rn = 1)
);

-- Step 4: Archive the smaller duplicate company
WITH widex_companies AS (
  SELECT 
    id, 
    name, 
    srn,
    (SELECT COUNT(*) FROM products WHERE company_id = companies.id AND is_archived = false) as product_count
  FROM companies 
  WHERE name ILIKE '%Widex A/S%' 
    AND srn = 'DK-MF-000025153'
    AND is_archived = false
),
target_companies AS (
  SELECT 
    id,
    product_count,
    ROW_NUMBER() OVER (ORDER BY product_count DESC) as rn
  FROM widex_companies
)
UPDATE companies 
SET 
  is_archived = true,
  archived_at = now(),
  archived_by = NULL -- System cleanup
WHERE id = (
  SELECT id FROM target_companies WHERE rn = 2
);