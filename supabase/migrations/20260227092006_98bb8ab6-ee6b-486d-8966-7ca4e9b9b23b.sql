-- 1. Update template item '3' → '3.1' (Design Information)
UPDATE gap_template_items 
SET clause_reference = '3.1', 
    requirement_text = 'Design Information',
    sort_order = 4
WHERE id = '7fa5a485-530f-4a93-845e-51d32a3103ba';

-- 2. Insert new template item for '3.2' (Manufacturing Information)
INSERT INTO gap_template_items (
  template_id, item_number, clause_reference, requirement_text, 
  sort_order, category, priority, is_applicable
) VALUES (
  '847a58f7-8ace-492e-8b17-c3bf9fadc39c',
  'II.6b',
  '3.2',
  'Manufacturing Information',
  5,
  'documentation',
  'high',
  true
);

-- 3. Fix sort_order for all MDR Annex II template items to match document structure
UPDATE gap_template_items SET sort_order = 1 WHERE id = 'c05c9fd3-bc05-4f6f-bffb-1e128c8a92cb'; -- 1.1
UPDATE gap_template_items SET sort_order = 2 WHERE id = 'c65c57bd-2881-4f6c-83e4-ea4cfb8cef49'; -- 1.2
UPDATE gap_template_items SET sort_order = 3 WHERE id = '0f47afcc-c528-4dc9-9660-d49abc3fc940'; -- 2
-- 3.1 already set to 4 above
-- 3.2 already set to 5 above
UPDATE gap_template_items SET sort_order = 6 WHERE id = '7edf21ec-1575-4a0a-b89a-16c94ebb9442'; -- 4 (GSPR)
UPDATE gap_template_items SET sort_order = 7 WHERE id = '6ed5f2c6-67a2-4419-9d50-0fe1f0c4bc7f'; -- 5 (Risk)
UPDATE gap_template_items SET sort_order = 8 WHERE id = '0c2a8a63-a120-4d01-82d0-b113ee6e8633'; -- 6.1
UPDATE gap_template_items SET sort_order = 9 WHERE id = '2fbd6846-7ff5-4f3a-9ebb-61663a3b4b29'; -- 6.2
UPDATE gap_template_items SET sort_order = 10 WHERE id = '879c7d32-e36a-4d0e-81fb-ceb6928d442d'; -- 7

-- 4. Update existing gap_analysis_items: section '3' → '3.1' (for MDR Annex II items only)
UPDATE gap_analysis_items 
SET section = '3.1'
WHERE section = '3' 
AND framework = 'MDR Annex II';

-- 5. Remove the old section '6' items that mapped to 'Clinical Evaluation' parent
-- (The actual items are 6.1 and 6.2, the parent '6' is redundant)
-- Check if template item for section '6' exists
DELETE FROM gap_template_items 
WHERE id = '4cc8a474-f0b8-45bb-8849-953f4e065520' 
AND clause_reference = '6';
