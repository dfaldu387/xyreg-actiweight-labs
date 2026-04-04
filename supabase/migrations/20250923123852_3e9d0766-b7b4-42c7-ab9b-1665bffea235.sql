-- Fix FDA gap analysis items to be company-wide instead of product-specific
-- since FDA 21 CFR Part 820 template has scope 'company'

UPDATE gap_analysis_items 
SET product_id = NULL 
WHERE framework = 'FDA_21_CFR_820' 
  AND product_id IN (
    SELECT p.id 
    FROM products p 
    JOIN companies c ON p.company_id = c.id 
    WHERE c.name = 'Heena Test'
  );