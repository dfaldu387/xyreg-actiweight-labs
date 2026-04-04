-- Add comprehensive medical device document templates
-- Insert documents for each phase of existing companies

DO $$
DECLARE
  phase_rec RECORD;
BEGIN
  -- Insert documents for each existing phase

  -- Concept & Feasibility Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Concept%Feasibility%' 
       OR p.name ILIKE '%Concept & Feasibility%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Business Case / Project Charter', 'Standard', 'company_template', 'template', 'All device types', 'Project rationale, objectives, business justification.'),
    (phase_rec.phase_id, 'Concept Brief', 'Standard', 'company_template', 'template', 'All device types', 'Defines initial concept, intended use, key features, target market, and regulatory strategy.'),
    (phase_rec.phase_id, 'User Needs Overview', 'Standard', 'company_template', 'template', 'All device types', 'Consolidated user requirements.'),
    (phase_rec.phase_id, 'Early Competitive Landscape Summary', 'Standard', 'company_template', 'template', 'All device types', 'Market competitor analysis and positioning.'),
    (phase_rec.phase_id, 'Draft Risk Management Plan', 'Quality', 'company_template', 'template', 'All device types', 'Preliminary document outlining approach to managing risks.'),
    (phase_rec.phase_id, 'Feasibility Study Report (with risk inputs)', 'Standard', 'company_template', 'template', 'All device types', 'Documentation assessing device feasibility with an emphasis on initial risk assessment.'),
    (phase_rec.phase_id, 'High-Level Architecture / Concept Diagram', 'Technical', 'company_template', 'template', 'All device types', 'Visual diagrams outlining the device''s overall system architecture and components.'),
    (phase_rec.phase_id, 'Initial Hazard Log / FMEA Entries', 'Quality', 'company_template', 'template', 'All device types', 'Early documentation of identified hazards and failure modes for risk management.'),
    (phase_rec.phase_id, 'Intellectual Property (IP) Review', 'Standard', 'company_template', 'template', 'All device types', 'Evaluation of intellectual property considerations and protection strategies.'),
    (phase_rec.phase_id, 'Preliminary Hazard Analysis (PHA)', 'Quality', 'company_template', 'template', 'All device types', 'Early-stage analysis identifying potential hazards and their impacts.'),
    (phase_rec.phase_id, 'Preliminary Market Analysis', 'Standard', 'company_template', 'template', 'All device types', 'Early assessment of market potential, size, and dynamics.'),
    (phase_rec.phase_id, 'Regulatory Strategy Outline', 'Regulatory', 'company_template', 'template', 'All device types', 'Document outlining the regulatory approval strategy and pathways.'),
    (phase_rec.phase_id, 'Resource & Budget Feasibility Study', 'Standard', 'company_template', 'template', 'All device types', 'Analysis of resource requirements and budget considerations.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Design Input Phase Documents  
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Design Input%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'User Needs Specification (UNS)', 'Design', 'company_template', 'template', 'All device types', 'Detailed specification of user needs and intended use requirements.'),
    (phase_rec.phase_id, 'Stakeholder Requirements Specification', 'Design', 'company_template', 'template', 'All device types', 'Documentation detailing requirements from stakeholders.'),
    (phase_rec.phase_id, 'Software Requirements Specification (SRS)', 'Technical', 'company_template', 'template', 'Software devices', 'Document outlining detailed software requirements.'),
    (phase_rec.phase_id, 'Biocompatibility Requirements', 'Clinical', 'company_template', 'template', 'Implantable devices', 'Biocompatibility testing and evaluation.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Design Output Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Design Output%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Detailed CAD Drawings & BOM', 'Technical', 'company_template', 'template', 'All device types', 'Technical drawings and Bill of Materials detailing device specifications.'),
    (phase_rec.phase_id, 'Electrical Schematics & PCB Layouts', 'Technical', 'company_template', 'template', 'Electronic devices', 'Detailed documentation of electrical designs and printed circuit board layouts.'),
    (phase_rec.phase_id, 'Software Architecture & Code Documentation', 'Technical', 'company_template', 'template', 'Software devices', 'Documentation detailing the software architecture and source code.'),
    (phase_rec.phase_id, 'Manufacturing Process Flowcharts & Work Instructions', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing manufacturing processes and procedures.'),
    (phase_rec.phase_id, 'Packaging Design Drawings', 'Technical', 'company_template', 'template', 'All device types', 'Technical drawings of packaging components.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Verification Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Verification%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Verification Master Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan outlining the strategy and procedures for verification activities.'),
    (phase_rec.phase_id, 'Verification Protocols & Acceptance Criteria', 'Quality', 'company_template', 'template', 'All device types', 'Detailed procedures and criteria for verifying design and performance specifications.'),
    (phase_rec.phase_id, 'Verification Test Reports (functional, EMC, biocomp., sterility, SW)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation of results from various verification tests.'),
    (phase_rec.phase_id, 'EMC Requirements (IEC 60601-1-2)', 'Regulatory', 'company_template', 'template', 'Electronic devices', 'Documentation ensuring compliance with electromagnetic compatibility standards.'),
    (phase_rec.phase_id, 'Software Validation Reports (IQ/OQ/PQ)', 'Technical', 'company_template', 'template', 'Software devices', 'Reports documenting software validation activities and outcomes.'),
    (phase_rec.phase_id, 'Calibration Certificates for Test Equipment', 'Quality', 'company_template', 'template', 'All device types', 'Calibration documentation for test equipment.'),
    (phase_rec.phase_id, 'Test Method Development Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan outlining methods for developing test procedures.'),
    (phase_rec.phase_id, 'Test Method Validation Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting validation of testing methods.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Validation Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Validation%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Validation Master Plan (Design, Clinical, Usability)', 'Clinical', 'company_template', 'template', 'All device types', 'Comprehensive plan detailing all validation activities for design, clinical, and usability aspects.'),
    (phase_rec.phase_id, 'Design Validation Reports (simulated & actual use)', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting validation tests under real and simulated conditions.'),
    (phase_rec.phase_id, 'Clinical Evaluation Plan & Protocols', 'Clinical', 'company_template', 'template', 'All device types', 'Clinical evaluation strategy and methods.'),
    (phase_rec.phase_id, 'Clinical Investigation / Trial Protocols & CRFs', 'Clinical', 'company_template', 'template', 'All device types', 'Clinical trial documentation.'),
    (phase_rec.phase_id, 'Usability Engineering File (UEF)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing usability assessments, user interface design, and risk management related to user interactions.'),
    (phase_rec.phase_id, 'Human Factors Use-Specifications', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing user interface requirements and usability considerations.'),
    (phase_rec.phase_id, 'Sterilization & Shelf-Life Validation Summaries', 'Quality', 'company_template', 'template', 'Sterile devices', 'Reports summarizing validation of sterilization processes and product shelf-life.'),
    (phase_rec.phase_id, 'Process Validation Protocols & Reports (sterility, shelf-life)', 'Quality', 'company_template', 'template', 'Sterile devices', 'Documentation of validation protocols and results for sterility and shelf-life.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Design Transfer Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Design Transfer%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Technical File / Design Dossier / Device Master Record', 'Regulatory', 'company_template', 'template', 'All device types', 'Comprehensive compilation of documentation required for regulatory submissions and production.'),
    (phase_rec.phase_id, 'Device History File (DHF) Index', 'Quality', 'company_template', 'template', 'All device types', 'Index documenting all development records maintained for regulatory compliance.'),
    (phase_rec.phase_id, 'Labeling & IFU Final', 'Regulatory', 'company_template', 'template', 'All device types', 'Final versions of labels and Instructions for Use for the device.'),
    (phase_rec.phase_id, 'Supplier Qualification Records', 'Quality', 'company_template', 'template', 'All device types', 'Documentation verifying qualifications and compliance of suppliers.'),
    (phase_rec.phase_id, 'Supplier / Contract Manufacturer Agreements', 'Quality', 'company_template', 'template', 'All device types', 'Formal agreements defining responsibilities and requirements with suppliers.'),
    (phase_rec.phase_id, '510(k) Submission / PMA Package', 'Regulatory', 'company_template', 'template', 'FDA regulated devices', 'FDA market submission documentation.'),
    (phase_rec.phase_id, 'CE Technical File & EU Declaration of Conformity', 'Regulatory', 'company_template', 'template', 'EU market devices', 'EU market entry technical and conformity documentation.'),
    (phase_rec.phase_id, 'ANVISA Registro', 'Regulatory', 'company_template', 'template', 'Brazil market devices', 'Brazilian regulatory approval documentation.'),
    (phase_rec.phase_id, 'ARTG Inclusion', 'Regulatory', 'company_template', 'template', 'Australia market devices', 'Australian market regulatory documentation.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Post-Market Surveillance Phase Documents
  FOR phase_rec IN 
    SELECT p.id as phase_id, p.company_id 
    FROM phases p 
    WHERE p.name ILIKE '%Post-Market%' OR p.name ILIKE '%Surveillance%'
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Post-Market Surveillance (PMS) Plan', 'Quality', 'company_template', 'template', 'All device types', 'Strategy and procedures for ongoing post-market device surveillance.'),
    (phase_rec.phase_id, 'Post-Market Clinical Follow-Up (PMCF) Plan', 'Clinical', 'company_template', 'template', 'All device types', 'Plan outlining post-market clinical data collection methods.'),
    (phase_rec.phase_id, 'CAPA Procedure (Post-Market)', 'Quality', 'company_template', 'template', 'All device types', 'Procedures for managing corrective and preventive actions.'),
    (phase_rec.phase_id, 'CAPA Records & Effectiveness Checks', 'Quality', 'company_template', 'template', 'All device types', 'Documentation of CAPA actions and effectiveness.'),
    (phase_rec.phase_id, 'Vigilance & Adverse Event Reporting Procedure', 'Regulatory', 'company_template', 'template', 'All device types', 'Defined procedures for reporting vigilance and adverse events.'),
    (phase_rec.phase_id, 'Vigilance Reports (MDR, MedWatch, etc.)', 'Regulatory', 'company_template', 'template', 'All device types', 'Reports documenting adverse events and vigilance activities submitted to regulatory authorities.'),
    (phase_rec.phase_id, 'Periodic Safety Update Reports (PSUR/PBRER)', 'Regulatory', 'company_template', 'template', 'All device types', 'Reports summarizing ongoing safety surveillance data.'),
    (phase_rec.phase_id, 'Field Safety Corrective Action (FSCA) Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting corrective actions taken in response to identified safety issues post-market.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

  -- Quality Management Documents (add to first phase for each company)
  FOR phase_rec IN 
    SELECT DISTINCT ON (p.company_id) p.id as phase_id, p.company_id, p.name 
    FROM phases p 
    ORDER BY p.company_id, p.created_at ASC
  LOOP
    INSERT INTO phase_assigned_documents (phase_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
    (phase_rec.phase_id, 'Quality Management Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan detailing overall quality management strategy and processes.'),
    (phase_rec.phase_id, 'Internal Audit Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting the findings of internal quality system audits.'),
    (phase_rec.phase_id, 'Management Review Minutes', 'Quality', 'company_template', 'template', 'All device types', 'Records documenting management reviews of the quality system.'),
    (phase_rec.phase_id, 'Periodic Audit / Review Schedule', 'Quality', 'company_template', 'template', 'All device types', 'Schedule documenting periodic internal and external audits.'),
    (phase_rec.phase_id, 'Traceability Matrices (Req → Design → Verif → Valid → Risk)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation demonstrating traceability across requirements, design, verification, validation, and risk management.')
    ON CONFLICT (phase_id, name) DO NOTHING;
  END LOOP;

END $$;