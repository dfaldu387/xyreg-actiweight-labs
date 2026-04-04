-- Move documents from phase_assigned_documents to phase_assigned_document_template for all companies
INSERT INTO phase_assigned_document_template (
  phase_id,
  name,
  document_type,
  status,
  tech_applicability,
  markets,
  classes_by_market,
  document_scope,
  is_excluded
)
SELECT 
  phase_id,
  name,
  document_type,
  status,
  tech_applicability,
  markets,
  classes_by_market,
  document_scope,
  is_excluded
FROM phase_assigned_documents
WHERE document_scope = 'company_template'
ON CONFLICT (phase_id, name) DO NOTHING;

-- Clean up the incorrectly placed documents
DELETE FROM phase_assigned_documents 
WHERE document_scope = 'company_template';