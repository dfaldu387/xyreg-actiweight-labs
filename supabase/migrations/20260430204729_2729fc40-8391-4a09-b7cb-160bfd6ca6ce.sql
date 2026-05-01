DELETE FROM document_studio_templates
WHERE template_id::text IN (
  SELECT id::text FROM phase_assigned_document_template
  WHERE derivation_type = 'work_instruction'
);

DELETE FROM phase_assigned_document_template
WHERE derivation_type = 'work_instruction';

DELETE FROM global_wi_company_materializations;

DELETE FROM global_work_instructions;
