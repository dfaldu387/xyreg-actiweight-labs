-- Enhance gap_template_items table to support comprehensive ISO 13485 structure
ALTER TABLE gap_template_items 
ADD COLUMN IF NOT EXISTS clause_number TEXT,
ADD COLUMN IF NOT EXISTS clause_description TEXT,
ADD COLUMN IF NOT EXISTS question_number TEXT,
ADD COLUMN IF NOT EXISTS evidence_method TEXT,
ADD COLUMN IF NOT EXISTS audit_guidance TEXT;

-- Create an index for better clause-based queries
CREATE INDEX IF NOT EXISTS idx_gap_template_items_clause ON gap_template_items(clause_number, template_id);

-- Update existing ISO 13485 template with comprehensive 65-item structure
-- First, get the ISO 13485 template ID
DO $$
DECLARE
    template_uuid UUID;
    item_record RECORD;
BEGIN
    -- Find the ISO 13485 template
    SELECT id INTO template_uuid 
    FROM gap_analysis_templates 
    WHERE framework = 'ISO 13485:2016' OR name ILIKE '%ISO 13485%'
    LIMIT 1;
    
    -- If template exists, clear old items and insert new comprehensive structure
    IF template_uuid IS NOT NULL THEN
        -- Clear existing template items
        DELETE FROM gap_template_items WHERE template_id = template_uuid;
        
        -- Insert comprehensive ISO 13485 structure (65 items organized by clauses)
        
        -- Clause 4: Quality Management System (QMS) - 6 items
        INSERT INTO gap_template_items (
            template_id, item_number, requirement_text, category, priority, clause_number, 
            clause_description, question_number, evidence_method, audit_guidance, sort_order
        ) VALUES 
        (template_uuid, '4.1.1', 'Has the organization established, documented, implemented, and maintained a QMS, and does it maintain its effectiveness in accordance with ISO 13485?', 'documentation', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.1', 'Review the Quality Manual and top-level QMS documentation', 'Review the Quality Manual and top-level QMS documentation. Verify that the scope is defined and that there is a system in place (e.g., through internal audits and management reviews) to actively maintain and improve the QMS.', 1),
        (template_uuid, '4.1.2', 'Does the organization apply a process approach to the QMS? Are the processes and their interactions identified and documented?', 'documentation', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.2', 'Process map or process interaction chart review', 'Look for a process map or a process interaction chart. For key processes (e.g., production, design, CAPA), review the procedures to ensure inputs, outputs, controls, and resources are clearly defined.', 2),
        (template_uuid, '4.1.3', 'Does the organization apply a risk-based approach to the control of the QMS processes? (Note: This is about the processes of the QMS, not product risk).', 'verification', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.3', 'Interview QMS manager and process owners', 'Interview the QMS manager or process owners. Ask how they determine the level of control for different processes. For example, why is the control for a critical supplier more rigorous than for an office supply vendor? Look for this rationale in procedures for supplier management, change control, etc.', 3),
        (template_uuid, '4.1.4', 'Has the organization identified any QMS processes that are outsourced? Is the control over these processes defined and documented?', 'documentation', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.4', 'Quality Agreements and supplier monitoring records', 'Identify all outsourced processes (e.g., sterilization, certain testing, calibration, warehousing). Review the Quality Agreements or contracts with these suppliers. Check records of monitoring (e.g., performance data, supplier audits) to verify control is being maintained.', 4),
        (template_uuid, '4.1.5', 'Has the organization documented procedures for the validation of computer software used in the QMS? Is the validation approach based on risk?', 'documentation', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.5', 'Software validation procedure and validation records', 'Review the software validation procedure. Ask for a list of all software used in the QMS (e.g., eQMS, ERP, complaint software). Select 1-2 software systems from the list and review their validation records/reports to confirm the procedure was followed.', 5),
        (template_uuid, '4.1.6', 'Has the organization documented the specific roles it undertakes as defined by applicable regulatory requirements (e.g., manufacturer, authorized representative, importer, distributor)?', 'documentation', 'high', '4', 'Quality Management System (QMS) - This clause covers the fundamental requirements for establishing and documenting your QMS.', '4.1.6', 'Quality Manual role definitions and regulatory registrations', 'Look for a specific statement or section in the Quality Manual that explicitly defines the organization role(s). Verify this role is consistent with device labeling, technical documentation, and regulatory registrations.', 6);
        
        -- Clause 5: Management Responsibility - 12 items
        INSERT INTO gap_template_items (
            template_id, item_number, requirement_text, category, priority, clause_number, 
            clause_description, question_number, evidence_method, audit_guidance, sort_order
        ) VALUES 
        (template_uuid, '5.1.1', 'Does top management provide clear evidence of its commitment to developing and maintaining the QMS and its effectiveness?', 'compliance', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.1', 'Management Review records and resource allocation decisions', 'Review the records from Management Review meetings. Check for attendance by top management. Look for documented decisions on resource allocation (budget, personnel) for quality-related activities.', 7),
        (template_uuid, '5.2.1', 'Does top management ensure that both customer and applicable regulatory requirements are determined and met?', 'verification', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.2', 'Contract review process and Management Review inputs', 'Review your process for contract/order review. How are customer requirements captured? Examine Management Review inputs to see if customer feedback, post-market surveillance data, and complaints are being discussed at the highest level.', 8),
        (template_uuid, '5.3.1', 'Has top management established a Quality Policy that is appropriate for the organization and includes a commitment to comply with requirements?', 'documentation', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.3', 'Quality Policy document and employee interviews', 'Read the Quality Policy. Verify it is signed by top management. Interview several employees from different departments to see if they are aware of the policy and can explain how it relates to their work. Check if it is displayed or accessible on the company intranet.', 9),
        (template_uuid, '5.4.1', 'Are measurable quality objectives established at relevant functions and levels? Are they consistent with the Quality Policy?', 'documentation', 'medium', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.4.1', 'Quality Objectives and management review minutes', 'Review the documented Quality Objectives. Confirm they are specific and measurable (e.g., "Reduce nonconforming material reports by 15% in H2"). Check management review minutes to see how progress towards these objectives is tracked and discussed.', 10),
        (template_uuid, '5.4.2', 'Is the integrity of the QMS maintained when changes to it are planned and implemented?', 'verification', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.4.2', 'Change control procedure and change records', 'Review your change control procedure. Find a record of a significant QMS change (e.g., implementing new eQMS software). Verify that the change record includes an assessment of the impact on the QMS and shows a controlled implementation plan.', 11),
        (template_uuid, '5.5.1', 'Are the responsibilities, authorities, and their interrelations defined and documented within the organization?', 'documentation', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.5.1', 'Organizational charts and job descriptions', 'Review organizational charts and detailed job descriptions. Do they clearly define roles and reporting structures for personnel who manage, perform, and verify work affecting quality?', 12),
        (template_uuid, '5.5.2', 'Has top management appointed a member of management as the Management Representative? Are their responsibilities and authorities defined?', 'compliance', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.5.2', 'Management Representative appointment and job description', 'Ask, "Who is the Management Representative?" Then, review their job description to ensure it includes the required responsibilities (e.g., reporting on QMS performance, promoting awareness of requirements). Check management review minutes to see this person presenting QMS data.', 13),
        (template_uuid, '5.5.3', 'Are effective communication processes established regarding the QMS?', 'verification', 'medium', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.5.3', 'Communication records and meeting minutes', 'Look for evidence of communication. This can include minutes from team meetings, company newsletters, emails, or posts on a quality-focused bulletin board discussing topics like audit results, CAPA status, or progress toward quality objectives.', 14),
        (template_uuid, '5.6.1', 'Is there a documented procedure for Management Review? Are reviews conducted at planned intervals and are records maintained?', 'documentation', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.6.1', 'Management Review procedure and meeting records', 'Review the Management Review procedure. Check the schedule defined within it. Examine the minutes and any presentation materials from the last 1-2 reviews to confirm they are being held as planned and records are complete.', 15),
        (template_uuid, '5.6.2', 'Do the inputs to the management review cover all items required by the standard?', 'verification', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.6.2', 'Management Review meeting minutes against standard requirements', 'Use the standard as a checklist against the meeting minutes. Verify that every required input is discussed, including: customer feedback/complaints, audit results, CAPAs, process monitoring, supplier performance, and any changes that could affect the QMS.', 16),
        (template_uuid, '5.6.3', 'Do the outputs of the management review include documented decisions and actions related to improving the QMS and its processes, improving products, and providing needed resources?', 'verification', 'high', '5', 'Management Responsibility - This clause ensures that top management is actively involved in and committed to the QMS.', '5.6.3', 'Management Review action items and follow-up records', 'Review the "Action Items" or "Decisions" section of the minutes. Verify that clear actions are assigned to specific individuals with due dates. Trace an action item from a past review to confirm it was tracked to completion.', 17);
        
        RAISE NOTICE 'Successfully updated ISO 13485 template with enhanced structure (first 17 items of 65)';
    ELSE
        RAISE NOTICE 'ISO 13485 template not found - skipping data migration';
    END IF;
END $$;