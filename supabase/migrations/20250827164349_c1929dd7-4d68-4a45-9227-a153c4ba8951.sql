-- Standardize framework names and clean up duplicates

-- 1. Update the newer template to use consistent framework naming
UPDATE gap_analysis_templates 
SET framework = 'ISO_13485'
WHERE id = '550e8400-e29b-41d4-a716-446655440065' AND framework = 'ISO 13485';

-- 2. Update all gap analysis items to use consistent framework naming
UPDATE gap_analysis_items 
SET framework = 'ISO_13485'
WHERE framework = 'ISO 13485';

-- 3. Keep only the 65-item template active, disable the old one
UPDATE company_gap_templates 
SET is_enabled = false
WHERE company_id = (SELECT id FROM companies WHERE name = 'Genis')
AND template_id = '9147d3ba-ea2d-4147-b684-8f03df4ebc26';

-- 4. Remove duplicate gap analysis items (keep the newer 65-item set)
-- First, identify items from the old template and remove them
DELETE FROM gap_analysis_items 
WHERE product_id IS NULL 
AND framework = 'ISO_13485'
AND requirement IN (
  SELECT requirement_text 
  FROM gap_template_items 
  WHERE template_id = '9147d3ba-ea2d-4147-b684-8f03df4ebc26'
);

-- 5. Add constraint to prevent framework naming inconsistencies
ALTER TABLE gap_analysis_templates 
ADD CONSTRAINT framework_naming_standard 
CHECK (framework ~ '^[A-Z0-9_]+$');