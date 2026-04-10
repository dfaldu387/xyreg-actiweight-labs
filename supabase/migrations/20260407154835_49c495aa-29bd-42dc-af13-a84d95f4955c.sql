
INSERT INTO phase_assigned_document_template (company_id, phase_id, name, description, document_type, document_scope, status, tech_applicability, markets, classes_by_market, is_predefined_core_template, file_name, file_path, file_size, file_type, uploaded_at, uploaded_by, reviewers, due_date, reviewer_group_id)
SELECT 
  c.id as company_id,
  np.phase_id,
  sop.name,
  sop.description,
  'SOP',
  'company_document',
  'Draft',
  'All device types',
  '{}',
  '{}',
  true,
  '',
  '',
  0,
  '',
  NULL,
  NULL,
  '{}',
  NULL,
  NULL
FROM companies c
CROSS JOIN (VALUES
  ('Quality Management System', 'QMS framework, quality policy, and process interactions'),
  ('Training and Competence', 'Training identification, delivery, and effectiveness evaluation'),
  ('Control of Monitoring and Measuring Equipment', 'Calibration and maintenance procedures'),
  ('Regulatory Submission Management', 'Regulatory submission planning and lifecycle management'),
  ('Design and Development', 'Design planning, inputs, outputs, reviews, and transfer'),
  ('Supplier Management', 'Supplier evaluation, qualification, and monitoring'),
  ('Risk Management', 'Risk management per ISO 14971'),
  ('Clinical Evaluation', 'Clinical evaluation, literature review, and CER generation'),
  ('Process Validation', 'IQ/OQ/PQ protocols and process capability assessment'),
  ('Production and Process Controls', 'Production planning, controls, and monitoring'),
  ('Complaint Handling', 'Complaint intake, investigation, and regulatory reporting'),
  ('Corrective and Preventive Action (CAPA)', 'CAPA process including root cause analysis and verification'),
  ('Post-Market Surveillance (PMS)', 'PMS activities, trend analysis, and PSUR generation'),
  ('Document Control', 'Document creation, review, approval, and distribution'),
  ('Management Review', 'Management review process and action tracking'),
  ('Internal Audits', 'Internal audit program, scheduling, and CAPA linkage'),
  ('Vigilance and Field Safety', 'Vigilance reporting and field safety corrective actions')
) AS sop(name, description)
CROSS JOIN LATERAL (
  SELECT DISTINCT ON (p.company_id) p.phase_id
  FROM phase_assigned_document_template p
  WHERE p.company_id = c.id AND p.document_scope = 'company_document'
  LIMIT 1
) np
WHERE NOT EXISTS (
  SELECT 1 FROM phase_assigned_document_template e 
  WHERE e.company_id = c.id 
    AND e.name = sop.name 
    AND e.document_scope = 'company_document' 
    AND e.document_type = 'SOP'
);
