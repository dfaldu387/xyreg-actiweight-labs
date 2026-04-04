-- Fix Widex duplicate company issue
-- Step 1: Identify the two Widex companies
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
-- Step 2: Move all products from smaller company to larger company
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