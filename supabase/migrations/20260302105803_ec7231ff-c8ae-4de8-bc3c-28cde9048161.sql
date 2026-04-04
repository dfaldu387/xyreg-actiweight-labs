
-- Insert 20 new priority SOPs for Acme inc using "No Phase" phase_id
INSERT INTO phase_assigned_document_template (company_id, name, document_type, document_scope, description, status, phase_id)
SELECT 
  'fbcf54d2-e734-4f94-a8a9-38ccba0e0b91',
  dct.name,
  'SOP',
  'company_document',
  dct.description,
  'Not Started',
  '285e8f5b-d2c2-40f0-bd64-4a06bad30363'
FROM default_company_document_template dct
WHERE dct.document_type = 'SOP'
AND dct.name IN (
  'SOP-001 Quality Management System',
  'SOP-002 Document Control',
  'SOP-003 Record Control',
  'SOP-004 Management Review',
  'SOP-005 Internal Audits',
  'SOP-006 Training and Competence',
  'SOP-007 Risk Management',
  'SOP-008 Design and Development',
  'SOP-009 Supplier Management',
  'SOP-010 Production and Process Controls',
  'SOP-011 Control of Nonconforming Product',
  'SOP-012 Corrective and Preventive Action (CAPA)',
  'SOP-013 Complaint Handling',
  'SOP-014 Post-Market Surveillance (PMS)',
  'SOP-015 Clinical Evaluation',
  'SOP-016 Labeling and Packaging Control',
  'SOP-017 Change Control',
  'SOP-018 Control of Monitoring and Measuring Equipment',
  'SOP-022 Vigilance and Field Safety',
  'SOP-034 Regulatory Submission Management'
);
