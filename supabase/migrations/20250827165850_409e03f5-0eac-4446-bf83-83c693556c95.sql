-- Update ISO 13485 gap template items with evidence & verification methods
-- Based on the comprehensive table provided by the user

-- Update Clause 4: Quality Management System (QMS)
UPDATE gap_template_items 
SET 
  requirement_text = 'Has the organization established, documented, implemented, and maintained a QMS, and does it maintain its effectiveness in accordance with ISO 13485?',
  evidence_method = 'Review the Quality Manual and top-level QMS documentation. Verify that the scope is defined and that there is a system in place (e.g., through internal audits and management reviews) to actively maintain and improve the QMS.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.1 General'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.1';

UPDATE gap_template_items 
SET 
  requirement_text = 'Does the organization apply a process approach to the QMS? Are the processes and their interactions identified and documented?',
  evidence_method = 'Look for a process map or a process interaction chart. For key processes (e.g., production, design, CAPA), review the procedures to ensure inputs, outputs, controls, and resources are clearly defined.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.2 Process Approach'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.2';

UPDATE gap_template_items 
SET 
  requirement_text = 'Does the organization apply a risk-based approach to the control of the QMS processes? (Note: This is about the processes of the QMS, not product risk).',
  evidence_method = 'Interview the QMS manager or process owners. Ask how they determine the level of control for different processes. For example, why is the control for a critical supplier more rigorous than for an office supply vendor? Look for this rationale in procedures for supplier management, change control, etc.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.3 Risk-Based Approach'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.3';

-- Update more items from Clause 4
UPDATE gap_template_items 
SET 
  requirement_text = 'Has the organization identified any QMS processes that are outsourced? Is the control over these processes defined and documented?',
  evidence_method = 'Identify all outsourced processes (e.g., sterilization, certain testing, calibration, warehousing). Review the Quality Agreements or contracts with these suppliers. Check records of monitoring (e.g., performance data, supplier audits) to verify control is being maintained.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.4 Outsourced Processes'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.4';

UPDATE gap_template_items 
SET 
  requirement_text = 'Has the organization documented procedures for the validation of computer software used in the QMS? Is the validation approach based on risk?',
  evidence_method = 'Review the software validation procedure. Ask for a list of all software used in the QMS (e.g., eQMS, ERP, complaint software). Select 1-2 software systems from the list and review their validation records/reports to confirm the procedure was followed.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.5 Computer Software Validation'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.5';

UPDATE gap_template_items 
SET 
  requirement_text = 'Has the organization documented the specific roles it undertakes as defined by applicable regulatory requirements (e.g., manufacturer, authorized representative, importer, distributor)?',
  evidence_method = 'Look for a specific statement or section in the Quality Manual that explicitly defines the organization''s role(s). Verify this role is consistent with device labeling, technical documentation, and regulatory registrations.',
  clause_description = 'This clause covers the fundamental requirements for establishing and documenting your QMS.',
  question_number = '4.1.6 Documented Roles'
WHERE template_id = '550e8400-e29b-41d4-a716-446655440065' AND item_number = '4.1.6';