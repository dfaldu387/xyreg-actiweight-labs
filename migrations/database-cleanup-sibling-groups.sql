-- Database Cleanup: Move Sibling Groups to Correct Table
-- This script moves incorrectly stored sibling group relationships from
-- product_accessory_relationships to product_sibling_group_relationships

-- Step 1: Identify sibling groups incorrectly stored in product_accessory_relationships
-- These are records where accessory_product_id is actually a sibling group ID

-- For main_product_id = 'bd9e9eb4-0cec-4000-80b5-e9d6697dedd1'
-- Sibling group IDs: 'd40b835c-2832-4b82-8aff-6c56a3f28e9f', '41320400-4537-424e-860c-97630395169c'

-- Step 2: Insert into correct table
INSERT INTO product_sibling_group_relationships (
  company_id,
  main_product_id,
  accessory_sibling_group_id,
  relationship_type,
  revenue_attribution_percentage,
  typical_quantity,
  is_required,
  initial_multiplier,
  recurring_multiplier,
  recurring_period,
  lifecycle_duration_months,
  seasonality_factors
)
SELECT
  company_id,
  main_product_id,
  accessory_product_id AS accessory_sibling_group_id,
  relationship_type,
  revenue_attribution_percentage,
  typical_quantity,
  is_required,
  initial_multiplier,
  recurring_multiplier,
  recurring_period,
  lifecycle_duration_months,
  seasonality_factors
FROM product_accessory_relationships
WHERE main_product_id = 'bd9e9eb4-0cec-4000-80b5-e9d6697dedd1'
  AND accessory_product_id IN (
    'd40b835c-2832-4b82-8aff-6c56a3f28e9f',
    '41320400-4537-424e-860c-97630395169c'
  );

-- Step 3: Delete the incorrect records
DELETE FROM product_accessory_relationships
WHERE main_product_id = 'bd9e9eb4-0cec-4000-80b5-e9d6697dedd1'
  AND accessory_product_id IN (
    'd40b835c-2832-4b82-8aff-6c56a3f28e9f',
    '41320400-4537-424e-860c-97630395169c'
  );

-- Verify the cleanup
SELECT 'Product Accessory Relationships (should be 2):' as status, COUNT(*) as count
FROM product_accessory_relationships
WHERE main_product_id = 'bd9e9eb4-0cec-4000-80b5-e9d6697dedd1'
UNION ALL
SELECT 'Sibling Group Relationships (should be 2):' as status, COUNT(*) as count
FROM product_sibling_group_relationships
WHERE main_product_id = 'bd9e9eb4-0cec-4000-80b5-e9d6697dedd1';
