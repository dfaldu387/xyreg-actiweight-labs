-- Fix the company_template_documents_by_phase view with correct columns
DROP VIEW IF EXISTS company_template_documents_by_phase;

CREATE VIEW company_template_documents_by_phase AS
SELECT 
  d.id,
  d.name,
  d.status,
  d.document_type,
  d.document_scope,
  d.description,
  d.file_path,
  d.file_name,
  d.file_size,
  d.file_type,
  d.template_source_id,
  d.tech_applicability,
  d.is_predefined_core_template,
  d.reviewer_group_ids,
  d.due_date,
  d.company_id,
  d.product_id,
  d.phase_id,
  d.created_at,
  d.updated_at,
  d.uploaded_at,
  d.uploaded_by,
  COALESCE(cp.name, 'No Phase') as phase_name
FROM documents d
LEFT JOIN company_phases cp ON d.phase_id = cp.id
WHERE d.document_scope IN ('company_template', 'company_document', 'product_document');