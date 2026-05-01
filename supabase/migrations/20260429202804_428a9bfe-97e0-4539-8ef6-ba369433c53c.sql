
-- 1) Re-point NO translation away from row being deleted (357bca8d) to the kept SOP-001 row (52f55562)
UPDATE phase_assigned_document_template
SET source_document_id = '52f55562-faea-4131-9977-2133e0fecbfa'
WHERE id = '5627a68e-19d0-4497-a955-6a1a068c3ee3'
  AND source_document_id = '357bca8d-11e4-4df9-b34a-fc2cdd56af4c';

-- 2) Delete duplicate Document Studio drafts attached to duplicate CIs we are removing
DELETE FROM document_studio_templates
WHERE template_id IN (
  '8e52211e-b8be-4725-a5ec-b4d739f0046f', -- dup SOP-001 (2026-04-29)
  '65010d7c-6201-4e64-8519-7a1626238f9f', -- dup SOP-002 Document Control (2026-04-29)
  '357bca8d-11e4-4df9-b34a-fc2cdd56af4c'  -- legacy mis-numbered "Quality Management System"
);

-- 3) Delete the duplicate CI rows
DELETE FROM phase_assigned_document_template
WHERE id IN (
  '8e52211e-b8be-4725-a5ec-b4d739f0046f',
  '65010d7c-6201-4e64-8519-7a1626238f9f',
  '357bca8d-11e4-4df9-b34a-fc2cdd56af4c'
);

-- 4) Standardize the kept canonical rows
UPDATE phase_assigned_document_template
SET name = 'SOP-001 Quality Management System',
    document_number = 'SOP-001'
WHERE id = '52f55562-faea-4131-9977-2133e0fecbfa';

UPDATE phase_assigned_document_template
SET name = 'SOP-002 Document Control',
    document_number = 'SOP-002'
WHERE id = '0a4d6de8-a07a-4da0-bf51-4ee4f02d63e3';

-- 5) Sync the kept Document Studio draft names to match
UPDATE document_studio_templates
SET name = 'SOP-002 Document Control'
WHERE template_id = '0a4d6de8-a07a-4da0-bf51-4ee4f02d63e3';

UPDATE document_studio_templates
SET name = 'SOP-001 Quality Management System'
WHERE template_id = '52f55562-faea-4131-9977-2133e0fecbfa';
