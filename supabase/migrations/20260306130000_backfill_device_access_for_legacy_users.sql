-- Backfill device access for legacy users
--
-- Previously, users with no record in user_product_matrix implicitly had
-- access to ALL devices. Now that document permissions depend on explicit
-- device access, we need to create user_product_matrix rows for every
-- legacy user so they retain their existing access.
--
-- Safe to re-run: skips users who already have an active record.

INSERT INTO user_product_matrix (
  user_id,
  company_id,
  product_ids,
  user_type,
  is_active,
  assigned_at
)
SELECT
  uca.user_id,
  uca.company_id,
  cp.product_ids,
  CASE uca.access_level
    WHEN 'admin'      THEN 'admin'
    WHEN 'consultant' THEN 'admin'
    WHEN 'editor'     THEN 'editor'
    ELSE 'viewer'
  END AS user_type,
  true AS is_active,
  now() AS assigned_at
FROM user_company_access uca
-- aggregate all non-archived product IDs per company
INNER JOIN (
  SELECT company_id, array_agg(id) AS product_ids
  FROM products
  WHERE is_archived = false
  GROUP BY company_id
) cp ON cp.company_id = uca.company_id
-- skip users who already have an active record
LEFT JOIN user_product_matrix upm
  ON upm.user_id = uca.user_id
  AND upm.company_id = uca.company_id
  AND upm.is_active = true
WHERE upm.id IS NULL
-- skip companies with no products
  AND cp.product_ids IS NOT NULL;
