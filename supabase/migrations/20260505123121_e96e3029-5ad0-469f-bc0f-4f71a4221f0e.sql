-- Remove leftover legacy bare-title SOP rows for David Health Solutions Oy.
-- All 28 Tier A canonical SOPs are already present; these 10 rows are redundant.
DELETE FROM public.phase_assigned_document_template
WHERE company_id = 'f3b39a35-4848-4738-ae29-91cfb8d72896'
  AND document_type = 'SOP'
  AND document_number IS NULL
  AND name IN (
    'Internal Audits',
    'Complaint Handling',
    'Production and Process Controls',
    'Process Validation',
    'Clinical Evaluation',
    'Supplier Management',
    'Regulatory Submission Management',
    'Training and Competence',
    'Control of Monitoring and Measuring Equipment',
    'Vigilance and Field Safety'
  );