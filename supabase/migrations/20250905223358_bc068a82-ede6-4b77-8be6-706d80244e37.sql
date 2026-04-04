-- Add comprehensive medical device document templates to phase_assigned_documents
-- These will appear in the Document CIs Library for companies to use

-- First, let's get all company IDs to add templates for existing companies
DO $$
DECLARE
    company_rec RECORD;
    concept_phase_id UUID;
    design_input_phase_id UUID;
    design_output_phase_id UUID;
    verification_phase_id UUID;
    validation_phase_id UUID;
    design_transfer_phase_id UUID;
    post_market_phase_id UUID;
BEGIN
    -- Loop through all companies
    FOR company_rec IN SELECT id, name FROM companies LOOP
        -- Get phase IDs for this company
        SELECT id INTO concept_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Concept & Feasibility' LIMIT 1;
        SELECT id INTO design_input_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Design Input' LIMIT 1;
        SELECT id INTO design_output_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Design Output' LIMIT 1;
        SELECT id INTO verification_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Verification' LIMIT 1;
        SELECT id INTO validation_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Validation (Design, Clinical, Usability)' LIMIT 1;
        SELECT id INTO design_transfer_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Design Transfer' LIMIT 1;
        SELECT id INTO post_market_phase_id FROM phases WHERE company_id = company_rec.id AND name = 'Post-Market Surveillance' LIMIT 1;

        -- Concept & Feasibility Phase Documents
        IF concept_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (concept_phase_id, company_rec.id, 'Business Case / Project Charter', 'Standard', 'company_template', 'template', 'All device types', 'Project rationale, objectives, business justification.'),
            (concept_phase_id, company_rec.id, 'Concept Brief', 'Standard', 'company_template', 'template', 'All device types', 'Defines initial concept, intended use, key features, target market, and regulatory strategy.'),
            (concept_phase_id, company_rec.id, 'Risk Management Report', 'Quality', 'company_template', 'template', 'All device types', 'Comprehensive summary of identified risks and controls.'),
            (concept_phase_id, company_rec.id, 'User Needs Overview', 'Standard', 'company_template', 'template', 'All device types', 'Consolidated user requirements.'),
            (concept_phase_id, company_rec.id, 'Early Competitive Landscape Summary', 'Standard', 'company_template', 'template', 'All device types', 'Market competitor analysis and positioning.'),
            (concept_phase_id, company_rec.id, 'Draft Risk Management Plan', 'Quality', 'company_template', 'template', 'All device types', 'Preliminary document outlining approach to managing risks.'),
            (concept_phase_id, company_rec.id, 'Feasibility Study Report (with risk inputs)', 'Standard', 'company_template', 'template', 'All device types', 'Documentation assessing device feasibility with an emphasis on initial risk assessment.'),
            (concept_phase_id, company_rec.id, 'High-Level Architecture / Concept Diagram', 'Technical', 'company_template', 'template', 'All device types', 'Visual diagrams outlining the device''s overall system architecture and components.'),
            (concept_phase_id, company_rec.id, 'Initial Hazard Log / FMEA Entries', 'Quality', 'company_template', 'template', 'All device types', 'Early documentation of identified hazards and failure modes for risk management.'),
            (concept_phase_id, company_rec.id, 'Intellectual Property (IP) Review', 'Standard', 'company_template', 'template', 'All device types', 'Evaluation of intellectual property considerations and protection strategies.'),
            (concept_phase_id, company_rec.id, 'Preliminary Hazard Analysis (PHA)', 'Quality', 'company_template', 'template', 'All device types', 'Early-stage analysis identifying potential hazards and their impacts.'),
            (concept_phase_id, company_rec.id, 'Preliminary Market Analysis', 'Standard', 'company_template', 'template', 'All device types', 'Early assessment of market potential, size, and dynamics.'),
            (concept_phase_id, company_rec.id, 'Regulatory Strategy Outline', 'Regulatory', 'company_template', 'template', 'All device types', 'Document outlining the regulatory approval strategy and pathways.'),
            (concept_phase_id, company_rec.id, 'Resource & Budget Feasibility Study', 'Standard', 'company_template', 'template', 'All device types', 'Analysis of resource requirements and budget considerations.')
            ON CONFLICT (phase_id, company_id, name) DO NOTHING;
        END IF;

        -- Design Input Phase Documents  
        IF design_input_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (design_input_phase_id, company_rec.id, 'User Needs Specification (UNS)', 'Design', 'company_template', 'template', 'All device types', 'Detailed specification of user needs and intended use requirements.'),
            (design_input_phase_id, company_rec.id, 'Stakeholder Requirements Specification', 'Design', 'company_template', 'template', 'All device types', 'Documentation detailing requirements from stakeholders.'),
            (design_input_phase_id, company_rec.id, 'Software Requirements Specification (SRS)', 'Technical', 'company_template', 'template', 'Software devices', 'Document outlining detailed software requirements.'),
            (design_input_phase_id, company_rec.id, 'Biocompatibility Requirements', 'Clinical', 'company_template', 'template', 'Implantable devices', 'Biocompatibility testing and evaluation.');
        END IF;

        -- Design Output Phase Documents
        IF design_output_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (design_output_phase_id, company_rec.id, 'Detailed CAD Drawings & BOM', 'Technical', 'company_template', 'template', 'All device types', 'Technical drawings and Bill of Materials detailing device specifications.'),
            (design_output_phase_id, company_rec.id, 'Electrical Schematics & PCB Layouts', 'Technical', 'company_template', 'template', 'Electronic devices', 'Detailed documentation of electrical designs and printed circuit board layouts.'),
            (design_output_phase_id, company_rec.id, 'Software Architecture & Code Documentation', 'Technical', 'company_template', 'template', 'Software devices', 'Documentation detailing the software architecture and source code.'),
            (design_output_phase_id, company_rec.id, 'Manufacturing Process Flowcharts & Work Instructions', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing manufacturing processes and procedures.'),
            (design_output_phase_id, company_rec.id, 'Packaging Design Drawings', 'Technical', 'company_template', 'template', 'All device types', 'Technical drawings of packaging components.');
        END IF;

        -- Verification Phase Documents
        IF verification_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (verification_phase_id, company_rec.id, 'Verification Master Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan outlining the strategy and procedures for verification activities.'),
            (verification_phase_id, company_rec.id, 'Verification Protocols & Acceptance Criteria', 'Quality', 'company_template', 'template', 'All device types', 'Detailed procedures and criteria for verifying design and performance specifications.'),
            (verification_phase_id, company_rec.id, 'Verification Test Reports (functional, EMC, biocomp., sterility, SW)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation of results from various verification tests.'),
            (verification_phase_id, company_rec.id, 'EMC Requirements (IEC 60601-1-2)', 'Regulatory', 'company_template', 'template', 'Electronic devices', 'Documentation ensuring compliance with electromagnetic compatibility standards.'),
            (verification_phase_id, company_rec.id, 'Software Validation Reports (IQ/OQ/PQ)', 'Technical', 'company_template', 'template', 'Software devices', 'Reports documenting software validation activities and outcomes.'),
            (verification_phase_id, company_rec.id, 'Calibration Certificates for Test Equipment', 'Quality', 'company_template', 'template', 'All device types', 'Calibration documentation for test equipment.'),
            (verification_phase_id, company_rec.id, 'Test Method Development Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan outlining methods for developing test procedures.'),
            (verification_phase_id, company_rec.id, 'Test Method Validation Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting validation of testing methods.');
        END IF;

        -- Validation Phase Documents
        IF validation_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (validation_phase_id, company_rec.id, 'Validation Master Plan (Design, Clinical, Usability)', 'Clinical', 'company_template', 'template', 'All device types', 'Comprehensive plan detailing all validation activities for design, clinical, and usability aspects.'),
            (validation_phase_id, company_rec.id, 'Design Validation Reports (simulated & actual use)', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting validation tests under real and simulated conditions.'),
            (validation_phase_id, company_rec.id, 'Clinical Evaluation Plan & Protocols', 'Clinical', 'company_template', 'template', 'All device types', 'Clinical evaluation strategy and methods.'),
            (validation_phase_id, company_rec.id, 'Clinical Investigation / Trial Protocols & CRFs', 'Clinical', 'company_template', 'template', 'All device types', 'Clinical trial documentation.'),
            (validation_phase_id, company_rec.id, 'Usability Engineering File (UEF)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing usability assessments, user interface design, and risk management related to user interactions.'),
            (validation_phase_id, company_rec.id, 'Human Factors Use-Specifications', 'Quality', 'company_template', 'template', 'All device types', 'Documentation detailing user interface requirements and usability considerations.'),
            (validation_phase_id, company_rec.id, 'Sterilization & Shelf-Life Validation Summaries', 'Quality', 'company_template', 'template', 'Sterile devices', 'Reports summarizing validation of sterilization processes and product shelf-life.'),
            (validation_phase_id, company_rec.id, 'Process Validation Protocols & Reports (sterility, shelf-life)', 'Quality', 'company_template', 'template', 'Sterile devices', 'Documentation of validation protocols and results for sterility and shelf-life.');
        END IF;

        -- Design Transfer Phase Documents
        IF design_transfer_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (design_transfer_phase_id, company_rec.id, 'Technical File / Design Dossier / Device Master Record', 'Regulatory', 'company_template', 'template', 'All device types', 'Comprehensive compilation of documentation required for regulatory submissions and production.'),
            (design_transfer_phase_id, company_rec.id, 'Device History File (DHF) Index', 'Quality', 'company_template', 'template', 'All device types', 'Index documenting all development records maintained for regulatory compliance.'),
            (design_transfer_phase_id, company_rec.id, 'Labeling & IFU Final', 'Regulatory', 'company_template', 'template', 'All device types', 'Final versions of labels and Instructions for Use for the device.'),
            (design_transfer_phase_id, company_rec.id, 'Supplier Qualification Records', 'Quality', 'company_template', 'template', 'All device types', 'Documentation verifying qualifications and compliance of suppliers.'),
            (design_transfer_phase_id, company_rec.id, 'Supplier / Contract Manufacturer Agreements', 'Quality', 'company_template', 'template', 'All device types', 'Formal agreements defining responsibilities and requirements with suppliers.'),
            (design_transfer_phase_id, company_rec.id, '510(k) Submission / PMA Package', 'Regulatory', 'company_template', 'template', 'FDA regulated devices', 'FDA market submission documentation.'),
            (design_transfer_phase_id, company_rec.id, 'CE Technical File & EU Declaration of Conformity', 'Regulatory', 'company_template', 'template', 'EU market devices', 'EU market entry technical and conformity documentation.'),
            (design_transfer_phase_id, company_rec.id, 'ANVISA Registro', 'Regulatory', 'company_template', 'template', 'Brazil market devices', 'Brazilian regulatory approval documentation.'),
            (design_transfer_phase_id, company_rec.id, 'ARTG Inclusion', 'Regulatory', 'company_template', 'template', 'Australia market devices', 'Australian market regulatory documentation.');
        END IF;

        -- Post-Market Surveillance Phase Documents
        IF post_market_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (post_market_phase_id, company_rec.id, 'Post-Market Surveillance (PMS) Plan', 'Quality', 'company_template', 'template', 'All device types', 'Strategy and procedures for ongoing post-market device surveillance.'),
            (post_market_phase_id, company_rec.id, 'Post-Market Clinical Follow-Up (PMCF) Plan', 'Clinical', 'company_template', 'template', 'All device types', 'Plan outlining post-market clinical data collection methods.'),
            (post_market_phase_id, company_rec.id, 'CAPA Procedure (Post-Market)', 'Quality', 'company_template', 'template', 'All device types', 'Procedures for managing corrective and preventive actions.'),
            (post_market_phase_id, company_rec.id, 'CAPA Records & Effectiveness Checks', 'Quality', 'company_template', 'template', 'All device types', 'Documentation of CAPA actions and effectiveness.'),
            (post_market_phase_id, company_rec.id, 'Vigilance & Adverse Event Reporting Procedure', 'Regulatory', 'company_template', 'template', 'All device types', 'Defined procedures for reporting vigilance and adverse events.'),
            (post_market_phase_id, company_rec.id, 'Vigilance Reports (MDR, MedWatch, etc.)', 'Regulatory', 'company_template', 'template', 'All device types', 'Reports documenting adverse events and vigilance activities submitted to regulatory authorities.'),
            (post_market_phase_id, company_rec.id, 'Periodic Safety Update Reports (PSUR/PBRER)', 'Regulatory', 'company_template', 'template', 'All device types', 'Reports summarizing ongoing safety surveillance data.'),
            (post_market_phase_id, company_rec.id, 'Field Safety Corrective Action (FSCA) Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting corrective actions taken in response to identified safety issues post-market.');
        END IF;

        -- Quality Management Documents (company-wide, not phase-specific)
        -- Insert into the first available phase for each company or create generic company templates
        IF concept_phase_id IS NOT NULL THEN
            INSERT INTO phase_assigned_documents (phase_id, company_id, name, document_type, document_scope, status, tech_applicability, description) VALUES
            (concept_phase_id, company_rec.id, 'Quality Management Plan', 'Quality', 'company_template', 'template', 'All device types', 'Plan detailing overall quality management strategy and processes.'),
            (concept_phase_id, company_rec.id, 'Internal Audit Reports', 'Quality', 'company_template', 'template', 'All device types', 'Reports documenting the findings of internal quality system audits.'),
            (concept_phase_id, company_rec.id, 'Management Review Minutes', 'Quality', 'company_template', 'template', 'All device types', 'Records documenting management reviews of the quality system.'),
            (concept_phase_id, company_rec.id, 'Periodic Audit / Review Schedule', 'Quality', 'company_template', 'template', 'All device types', 'Schedule documenting periodic internal and external audits.'),
            (concept_phase_id, company_rec.id, 'Traceability Matrices (Req → Design → Verif → Valid → Risk)', 'Quality', 'company_template', 'template', 'All device types', 'Documentation demonstrating traceability across requirements, design, verification, validation, and risk management.')
            ON CONFLICT (phase_id, company_id, name) DO NOTHING;
        END IF;

    END LOOP;
END $$;