-- =====================================================
-- FDA QMSR Gap Analysis Template
-- Effective: February 2, 2026
-- Incorporates ISO 13485:2016 by reference + retained 820 sections
-- =====================================================

-- First, insert the main template
INSERT INTO gap_analysis_templates (
  id, name, framework, description, importance, scope, is_active, is_custom, created_at, updated_at
) VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'FDA QMSR - Quality Management System Regulation',
  'FDA_QMSR',
  'FDA QMSR (effective Feb 2, 2026) incorporates ISO 13485:2016 by reference with retained Part 820 sections (820.1, 820.3, 820.7, 820.10, 820.35, 820.45). Replaces standalone 21 CFR Part 820 QSR. Internal audits, supplier audits, and management reviews are now subject to FDA inspection.',
  'high',
  'company',
  true,
  false,
  now(),
  now()
);

-- Now insert the gap template items with correct column names
-- template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order

-- =====================================================
-- CLAUSE 4: QUALITY MANAGEMENT SYSTEM
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.1.1', 'Establish, document, implement, and maintain a quality management system', 'ISO 13485:2016 Clause 4.1', 'documentation', 'Quality Management System', 'QMS Establishment', 'high', 'primary', 'secondary', 'none', 1),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.1.2', 'Define the scope of the QMS including justification for any exclusions', 'ISO 13485:2016 Clause 4.1', 'documentation', 'Quality Management System', 'Scope Definition', 'high', 'primary', 'none', 'none', 2),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.1.3', 'Apply a risk-based approach to control of QMS processes', 'ISO 13485:2016 Clause 4.1.2', 'compliance', 'Quality Management System', 'Risk-Based Approach', 'high', 'primary', 'secondary', 'secondary', 3),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.1.4', 'Document software validation procedures for QMS software', 'ISO 13485:2016 Clause 4.1.6', 'verification', 'Quality Management System', 'Software Validation', 'medium', 'primary', 'secondary', 'none', 4),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.2.1', 'Establish and maintain a quality manual', 'ISO 13485:2016 Clause 4.2.1', 'documentation', 'Quality Management System', 'Quality Manual', 'high', 'primary', 'none', 'none', 5),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.2.2', 'Establish a medical device file for each device type/family', 'ISO 13485:2016 Clause 4.2.3', 'documentation', 'Quality Management System', 'Device File', 'high', 'primary', 'secondary', 'none', 6),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.2.3', 'Establish documented procedures for document control', 'ISO 13485:2016 Clause 4.2.4', 'documentation', 'Quality Management System', 'Document Control', 'high', 'primary', 'none', 'none', 7),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-4.2.4', 'Establish documented procedures for control of records', 'ISO 13485:2016 Clause 4.2.5', 'documentation', 'Quality Management System', 'Record Control', 'high', 'primary', 'none', 'secondary', 8);

-- =====================================================
-- CLAUSE 5: MANAGEMENT RESPONSIBILITY
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.1.1', 'Top management commitment to QMS development and effectiveness', 'ISO 13485:2016 Clause 5.1', 'compliance', 'Management Responsibility', 'Leadership', 'high', 'primary', 'none', 'none', 9),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.2.1', 'Ensure customer and regulatory requirements are determined and met', 'ISO 13485:2016 Clause 5.2', 'compliance', 'Management Responsibility', 'Requirements', 'high', 'primary', 'secondary', 'secondary', 10),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.3.1', 'Establish and document quality policy', 'ISO 13485:2016 Clause 5.3', 'documentation', 'Management Responsibility', 'Policy Statement', 'high', 'primary', 'none', 'none', 11),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.4.1', 'Establish measurable quality objectives at relevant functions and levels', 'ISO 13485:2016 Clause 5.4.1', 'documentation', 'Management Responsibility', 'Quality Objectives', 'high', 'primary', 'secondary', 'secondary', 12),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.4.2', 'Plan QMS to meet requirements and quality objectives', 'ISO 13485:2016 Clause 5.4.2', 'documentation', 'Management Responsibility', 'QMS Planning', 'high', 'primary', 'none', 'none', 13),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.5.1', 'Define and communicate responsibilities and authorities', 'ISO 13485:2016 Clause 5.5.1', 'documentation', 'Management Responsibility', 'Roles', 'high', 'primary', 'none', 'none', 14),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.5.2', 'Appoint a management representative for the QMS', 'ISO 13485:2016 Clause 5.5.2', 'compliance', 'Management Responsibility', 'Management Representative', 'high', 'primary', 'none', 'none', 15),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.5.3', 'Establish processes for internal communication', 'ISO 13485:2016 Clause 5.5.3', 'compliance', 'Management Responsibility', 'Internal Communication', 'medium', 'primary', 'none', 'none', 16),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.6.1', 'Review the QMS at planned intervals (management review) - NOTE: Now subject to FDA inspection', 'ISO 13485:2016 Clause 5.6.1', 'verification', 'Management Responsibility', 'Management Review', 'high', 'primary', 'secondary', 'secondary', 17),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.6.2', 'Include required inputs in management review (audit results, feedback, CAPA, etc.)', 'ISO 13485:2016 Clause 5.6.2', 'documentation', 'Management Responsibility', 'Review Inputs', 'high', 'primary', 'none', 'none', 18),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-5.6.3', 'Document management review outputs and decisions', 'ISO 13485:2016 Clause 5.6.3', 'documentation', 'Management Responsibility', 'Review Outputs', 'high', 'primary', 'none', 'none', 19);

-- =====================================================
-- CLAUSE 6: RESOURCE MANAGEMENT
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.1.1', 'Determine and provide resources for QMS implementation and maintenance', 'ISO 13485:2016 Clause 6.1', 'compliance', 'Resource Management', 'Resource Allocation', 'high', 'primary', 'secondary', 'secondary', 20),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.2.1', 'Determine necessary competence for personnel affecting product quality', 'ISO 13485:2016 Clause 6.2', 'documentation', 'Resource Management', 'Competence', 'high', 'primary', 'secondary', 'secondary', 21),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.2.2', 'Provide training or take other actions to achieve necessary competence', 'ISO 13485:2016 Clause 6.2', 'compliance', 'Resource Management', 'Training', 'high', 'primary', 'secondary', 'secondary', 22),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.2.3', 'Maintain records of education, training, skills, and experience', 'ISO 13485:2016 Clause 6.2', 'documentation', 'Resource Management', 'Training Records', 'high', 'primary', 'none', 'secondary', 23),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.3.1', 'Determine, provide, and maintain infrastructure needed for conformity', 'ISO 13485:2016 Clause 6.3', 'compliance', 'Resource Management', 'Facilities', 'medium', 'secondary', 'secondary', 'primary', 24),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.3.2', 'Document requirements for maintenance activities when they affect product quality', 'ISO 13485:2016 Clause 6.3', 'documentation', 'Resource Management', 'Maintenance', 'medium', 'secondary', 'none', 'primary', 25),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.4.1', 'Determine and manage the work environment needed for conformity', 'ISO 13485:2016 Clause 6.4.1', 'compliance', 'Resource Management', 'Environmental Conditions', 'medium', 'secondary', 'secondary', 'primary', 26),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-6.4.2', 'Document requirements for health, cleanliness, and clothing of personnel', 'ISO 13485:2016 Clause 6.4.2', 'documentation', 'Resource Management', 'Personnel Requirements', 'medium', 'secondary', 'none', 'primary', 27);

-- =====================================================
-- CLAUSE 7: PRODUCT REALIZATION
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.1.1', 'Plan and develop processes needed for product realization', 'ISO 13485:2016 Clause 7.1', 'documentation', 'Product Realization', 'Realization Planning', 'high', 'primary', 'secondary', 'secondary', 28),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.1.2', 'Apply risk management throughout product realization', 'ISO 13485:2016 Clause 7.1', 'compliance', 'Product Realization', 'Risk Management', 'high', 'primary', 'primary', 'secondary', 29),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.1.3', 'Maintain records of risk management activities', 'ISO 13485:2016 Clause 7.1', 'documentation', 'Product Realization', 'Risk Records', 'high', 'primary', 'primary', 'none', 30),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.2.1', 'Determine customer and regulatory requirements for the product', 'ISO 13485:2016 Clause 7.2.1', 'documentation', 'Product Realization', 'Requirements Determination', 'high', 'primary', 'secondary', 'none', 31),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.2.2', 'Review product requirements before commitment to supply', 'ISO 13485:2016 Clause 7.2.2', 'verification', 'Product Realization', 'Requirements Review', 'high', 'primary', 'secondary', 'none', 32),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.2.3', 'Plan and document arrangements for communicating with customers', 'ISO 13485:2016 Clause 7.2.3', 'documentation', 'Product Realization', 'Customer Communication', 'medium', 'primary', 'none', 'secondary', 33);

-- Design and Development (7.3)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.1', 'Establish documented procedures for design and development', 'ISO 13485:2016 Clause 7.3.1', 'documentation', 'Design and Development', 'D&D Procedures', 'high', 'secondary', 'primary', 'none', 34),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.2', 'Plan design and development with defined stages, reviews, and responsibilities', 'ISO 13485:2016 Clause 7.3.2', 'documentation', 'Design and Development', 'D&D Planning', 'high', 'secondary', 'primary', 'none', 35),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.3', 'Determine and document design inputs including functional, performance, safety, and regulatory requirements', 'ISO 13485:2016 Clause 7.3.3', 'documentation', 'Design and Development', 'Design Inputs', 'high', 'secondary', 'primary', 'none', 36),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.4', 'Document design outputs that meet input requirements and provide information for production', 'ISO 13485:2016 Clause 7.3.4', 'documentation', 'Design and Development', 'Design Outputs', 'high', 'secondary', 'primary', 'none', 37),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.5', 'Conduct design reviews at suitable stages', 'ISO 13485:2016 Clause 7.3.5', 'verification', 'Design and Development', 'Design Review', 'high', 'secondary', 'primary', 'secondary', 38),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.6', 'Perform design verification to confirm outputs meet input requirements', 'ISO 13485:2016 Clause 7.3.6', 'verification', 'Design and Development', 'Design Verification', 'high', 'secondary', 'primary', 'none', 39),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.7', 'Perform design validation to confirm product meets user needs and intended use', 'ISO 13485:2016 Clause 7.3.7', 'verification', 'Design and Development', 'Design Validation', 'high', 'secondary', 'primary', 'secondary', 40),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.8', 'Establish procedures for design transfer to production', 'ISO 13485:2016 Clause 7.3.8', 'documentation', 'Design and Development', 'Design Transfer', 'high', 'secondary', 'primary', 'primary', 41),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.9', 'Establish procedures for control of design and development changes', 'ISO 13485:2016 Clause 7.3.9', 'documentation', 'Design and Development', 'Design Changes', 'high', 'primary', 'primary', 'secondary', 42),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.3.10', 'Maintain design and development files (DHF equivalent - may continue using DHF terminology per FDA)', 'ISO 13485:2016 Clause 7.3.10', 'documentation', 'Design and Development', 'Design Files', 'high', 'primary', 'primary', 'none', 43);

-- Purchasing (7.4)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.4.1', 'Establish documented procedures for ensuring purchased product conforms to requirements', 'ISO 13485:2016 Clause 7.4.1', 'documentation', 'Purchasing', 'Purchasing Process', 'high', 'primary', 'none', 'primary', 44),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.4.2', 'Evaluate and select suppliers based on their ability to meet requirements - NOTE: Supplier audit records now subject to FDA inspection', 'ISO 13485:2016 Clause 7.4.1', 'verification', 'Purchasing', 'Supplier Evaluation', 'high', 'primary', 'none', 'primary', 45),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.4.3', 'Maintain records of supplier evaluations and monitoring', 'ISO 13485:2016 Clause 7.4.1', 'documentation', 'Purchasing', 'Supplier Records', 'high', 'primary', 'none', 'primary', 46),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.4.4', 'Define purchasing information requirements including specifications and QMS requirements', 'ISO 13485:2016 Clause 7.4.2', 'documentation', 'Purchasing', 'Purchasing Information', 'high', 'secondary', 'secondary', 'primary', 47),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.4.5', 'Establish and implement inspection or verification of purchased product', 'ISO 13485:2016 Clause 7.4.3', 'verification', 'Purchasing', 'Incoming Inspection', 'high', 'secondary', 'none', 'primary', 48);

-- Production and Service Provision (7.5)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.1', 'Plan and carry out production and service provision under controlled conditions', 'ISO 13485:2016 Clause 7.5.1', 'compliance', 'Production and Service', 'Control of Production', 'high', 'secondary', 'none', 'primary', 49),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.2', 'Document procedures for cleanliness of product and contamination control', 'ISO 13485:2016 Clause 7.5.2', 'documentation', 'Production and Service', 'Cleanliness', 'medium', 'secondary', 'none', 'primary', 50),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.3', 'Document requirements for installation and verification activities', 'ISO 13485:2016 Clause 7.5.3', 'documentation', 'Production and Service', 'Installation', 'medium', 'secondary', 'secondary', 'primary', 51),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.4', 'Document requirements for servicing activities and records', 'ISO 13485:2016 Clause 7.5.4', 'documentation', 'Production and Service', 'Servicing', 'medium', 'secondary', 'none', 'primary', 52),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.5', 'Document requirements for sterile medical devices (if applicable)', 'ISO 13485:2016 Clause 7.5.5', 'documentation', 'Production and Service', 'Sterile Devices', 'high', 'secondary', 'secondary', 'primary', 53),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.6', 'Validate processes where output cannot be verified by subsequent monitoring', 'ISO 13485:2016 Clause 7.5.6', 'verification', 'Production and Service', 'Process Validation', 'high', 'secondary', 'secondary', 'primary', 54),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.7', 'Document requirements for validation of sterilization and sterile barrier systems', 'ISO 13485:2016 Clause 7.5.7', 'verification', 'Production and Service', 'Sterilization Validation', 'high', 'secondary', 'secondary', 'primary', 55),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.8', 'Identify product by suitable means throughout product realization (DMR/DHR equivalent - may continue using terminology per FDA)', 'ISO 13485:2016 Clause 7.5.8', 'compliance', 'Production and Service', 'Identification', 'high', 'secondary', 'none', 'primary', 56),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.9', 'Document procedures for traceability and maintain traceability records', 'ISO 13485:2016 Clause 7.5.9', 'documentation', 'Production and Service', 'Traceability', 'high', 'primary', 'none', 'primary', 57),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.10', 'Identify, verify, protect, and safeguard customer property', 'ISO 13485:2016 Clause 7.5.10', 'compliance', 'Production and Service', 'Customer Property', 'medium', 'secondary', 'none', 'primary', 58),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.5.11', 'Preserve product conformity during internal processing and delivery', 'ISO 13485:2016 Clause 7.5.11', 'compliance', 'Production and Service', 'Preservation', 'high', 'secondary', 'none', 'primary', 59);

-- Control of Monitoring and Measuring Equipment (7.6)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.6.1', 'Determine monitoring and measurement needed to demonstrate product conformity', 'ISO 13485:2016 Clause 7.6', 'documentation', 'Monitoring Equipment', 'Equipment Requirements', 'high', 'secondary', 'secondary', 'primary', 60),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.6.2', 'Establish documented procedures for calibration and verification of equipment', 'ISO 13485:2016 Clause 7.6', 'documentation', 'Monitoring Equipment', 'Calibration Procedures', 'high', 'secondary', 'none', 'primary', 61),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-7.6.3', 'Maintain records of calibration and verification results', 'ISO 13485:2016 Clause 7.6', 'documentation', 'Monitoring Equipment', 'Calibration Records', 'high', 'secondary', 'none', 'primary', 62);

-- =====================================================
-- CLAUSE 8: MEASUREMENT, ANALYSIS AND IMPROVEMENT
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.1.1', 'Plan and implement monitoring, measurement, analysis, and improvement processes', 'ISO 13485:2016 Clause 8.1', 'documentation', 'Measurement and Improvement', 'Planning', 'high', 'primary', 'secondary', 'secondary', 63),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.1', 'Gather and document feedback as input to monitoring product realization and improvement', 'ISO 13485:2016 Clause 8.2.1', 'documentation', 'Measurement and Improvement', 'Feedback', 'high', 'primary', 'secondary', 'secondary', 64),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.2', 'Establish documented procedures for handling complaints', 'ISO 13485:2016 Clause 8.2.2', 'documentation', 'Measurement and Improvement', 'Complaint Handling', 'high', 'primary', 'secondary', 'secondary', 65),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.3', 'Establish documented procedures for reporting to regulatory authorities', 'ISO 13485:2016 Clause 8.2.3', 'documentation', 'Measurement and Improvement', 'Regulatory Reporting', 'high', 'primary', 'none', 'none', 66),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.4', 'Conduct internal audits at planned intervals - NOTE: Internal audit records are NOW subject to FDA inspection under QMSR', 'ISO 13485:2016 Clause 8.2.4', 'verification', 'Measurement and Improvement', 'Internal Audit', 'high', 'primary', 'none', 'secondary', 67),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.5', 'Document internal audit procedures, planning, and records', 'ISO 13485:2016 Clause 8.2.4', 'documentation', 'Measurement and Improvement', 'Audit Documentation', 'high', 'primary', 'none', 'none', 68),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.6', 'Apply suitable methods for monitoring and measuring QMS processes', 'ISO 13485:2016 Clause 8.2.5', 'verification', 'Measurement and Improvement', 'Process Monitoring', 'medium', 'primary', 'secondary', 'secondary', 69),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.2.7', 'Monitor and measure product characteristics at appropriate stages', 'ISO 13485:2016 Clause 8.2.6', 'verification', 'Measurement and Improvement', 'Product Monitoring', 'high', 'secondary', 'secondary', 'primary', 70);

-- Control of Nonconforming Product (8.3)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.3.1', 'Establish documented procedures for control of nonconforming product', 'ISO 13485:2016 Clause 8.3', 'documentation', 'Nonconforming Product', 'NC Procedures', 'high', 'primary', 'secondary', 'primary', 71),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.3.2', 'Document actions taken to eliminate detected nonconformities', 'ISO 13485:2016 Clause 8.3', 'documentation', 'Nonconforming Product', 'NC Actions', 'high', 'primary', 'secondary', 'primary', 72),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.3.3', 'Establish documented procedures for issuing advisory notices', 'ISO 13485:2016 Clause 8.3.3', 'documentation', 'Nonconforming Product', 'Advisory Notices', 'high', 'primary', 'none', 'none', 73),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.3.4', 'Document procedures for rework and maintain rework records', 'ISO 13485:2016 Clause 8.3.4', 'documentation', 'Nonconforming Product', 'Rework', 'medium', 'secondary', 'secondary', 'primary', 74);

-- Analysis of Data (8.4)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.4.1', 'Establish documented procedures for determining, collecting, and analyzing data', 'ISO 13485:2016 Clause 8.4', 'documentation', 'Data Analysis', 'Data Analysis', 'high', 'primary', 'secondary', 'secondary', 75);

-- Improvement (8.5)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.5.1', 'Establish documented procedures for corrective action', 'ISO 13485:2016 Clause 8.5.2', 'documentation', 'Improvement', 'Corrective Action', 'high', 'primary', 'secondary', 'secondary', 76),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-8.5.2', 'Establish documented procedures for preventive action', 'ISO 13485:2016 Clause 8.5.3', 'documentation', 'Improvement', 'Preventive Action', 'high', 'primary', 'secondary', 'secondary', 77);

-- =====================================================
-- RETAINED PART 820 SECTIONS (FDA-SPECIFIC)
-- =====================================================

INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.10.1', 'Maintain traceability for devices intended for surgical implantation or life-supporting/sustaining use', '21 CFR 820.10 (Retained)', 'compliance', 'Retained 820 Sections', 'Life-Supporting Devices', 'high', 'primary', 'none', 'primary', 78),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.10.2', 'Link QMS to Medical Device Reporting (21 CFR Part 803) requirements', '21 CFR 820.10 (Retained)', 'compliance', 'Retained 820 Sections', 'MDR Link', 'high', 'primary', 'none', 'none', 79),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.10.3', 'Link QMS to Corrections and Removals (21 CFR Part 806) requirements', '21 CFR 820.10 (Retained)', 'compliance', 'Retained 820 Sections', 'Corrections Link', 'high', 'primary', 'none', 'none', 80),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.10.4', 'Link QMS to Medical Device Tracking (21 CFR Part 821) requirements if applicable', '21 CFR 820.10 (Retained)', 'compliance', 'Retained 820 Sections', 'Tracking Link', 'medium', 'primary', 'none', 'none', 81),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.10.5', 'Link QMS to Unique Device Identification (21 CFR Part 830) requirements', '21 CFR 820.10 (Retained)', 'compliance', 'Retained 820 Sections', 'UDI Link', 'high', 'primary', 'none', 'secondary', 82);

-- 820.35 - Control of Records (Complaints) - ENHANCED
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.35.1', 'Maintain complaint records with investigation documentation per 820.35(a)', '21 CFR 820.35 (Retained)', 'documentation', 'Retained 820 Sections', 'Investigation Records', 'high', 'primary', 'secondary', 'none', 83),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.35.2', 'Record the reason if no investigation was made for a complaint', '21 CFR 820.35 (Retained)', 'documentation', 'Retained 820 Sections', 'No Investigation Rationale', 'high', 'primary', 'none', 'none', 84),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.35.3', 'Maintain service records and analyze for quality data per 820.35(b)', '21 CFR 820.35 (Retained)', 'documentation', 'Retained 820 Sections', 'Service Data Analysis', 'high', 'primary', 'none', 'secondary', 85);

-- 820.45 - Device Labeling (Enhanced Inspection Requirements)
INSERT INTO gap_template_items (template_id, item_number, requirement_text, clause_reference, category, chapter, subsection, priority, qa_ra_owner, rd_owner, mfg_ops_owner, labeling_owner, sort_order) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.45.1', 'Establish and maintain labeling inspection procedures per 820.45', '21 CFR 820.45 (Retained)', 'verification', 'Retained 820 Sections', 'Labeling Inspection', 'high', 'primary', 'secondary', 'primary', 'primary', 86),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.45.2', 'Inspect labeling for accuracy including correct UDI, expiration date, and storage instructions', '21 CFR 820.45 (Retained)', 'verification', 'Retained 820 Sections', 'Label Accuracy', 'high', 'primary', 'none', 'primary', 'primary', 87),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'QMSR-820.45.3', 'Inspect packaging for compliance with specifications', '21 CFR 820.45 (Retained)', 'verification', 'Retained 820 Sections', 'Packaging Inspection', 'high', 'secondary', 'none', 'primary', 'primary', 88);