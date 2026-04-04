export interface XyregModuleGroup {
  id: string;
  name: string;
  features: string[];
  processRisk: 'low' | 'medium' | 'high';
  softwareRisk: 'low' | 'medium' | 'high';
  coreDependencies: string[];
  sopNumbers: string[];
  isoClauseRefs: string[];
  intendedUse: string;
  boundaryNotes: string;
  acceptanceCriteria?: {
    iq: string;
    oq: string;
    pq: string;
  };
  testSteps?: {
    iq: { step: string; expectedResult: string }[];
    oq: { step: string; expectedResult: string }[];
    pq: { step: string; expectedResult: string }[];
  };
  infrastructureDependencies?: {
    assetId: string;
    assetName: string;
    reason: string;
  }[];
}

export const XYREG_MODULE_GROUPS: XyregModuleGroup[] = [
  {
    id: 'document_control',
    name: 'Document Control',
    features: ['Document Studio', 'Templates', 'eSignatures'],
    processRisk: 'medium',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'audit_ledger'],
    sopNumbers: ['SOP-001', 'SOP-002'],
    isoClauseRefs: ['4.2.4', '4.2.5'],
    intendedUse: 'Create, review, approve, and control quality management system documents with electronic signatures and full audit trail.',
    boundaryNotes: 'Includes document lifecycle management, template generation, and eSignature workflows. Excludes external document storage integrations.',
    acceptanceCriteria: {
      iq: 'All document control features are installed and accessible per the vendor specification. Templates, eSignature, and audit trail modules are present.',
      oq: 'Document creation, review, approval, and versioning workflows execute correctly under all specified conditions without data loss.',
      pq: 'Document control processes perform reliably in the production environment over the defined test period with no critical deviations.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Document Studio from the main menu', expectedResult: 'Document Studio loads without errors' },
        { step: 'Verify Templates section is accessible', expectedResult: 'Template list is displayed with available templates' },
        { step: 'Check that eSignature module is present in document workflows', expectedResult: 'Signature options appear in document actions' },
      ],
      oq: [
        { step: 'Create a new document from an existing template', expectedResult: 'Document is created with correct metadata and version number' },
        { step: 'Submit the document for review and approval', expectedResult: 'Review workflow initiates and notifications are sent' },
        { step: 'Apply an eSignature to approve the document', expectedResult: 'Signature is recorded with timestamp and user identity' },
        { step: 'Check the audit trail for the document', expectedResult: 'All actions (create, review, approve) are logged with timestamps' },
      ],
      pq: [
        { step: 'Complete a full document review cycle with your team (create → review → approve → release)', expectedResult: 'Document progresses through all lifecycle stages without errors' },
        { step: 'Verify all signatures are captured in the released document', expectedResult: 'All required signatures present with correct dates and identities' },
        { step: 'Search for the released document using keyword search', expectedResult: 'Document is retrievable and displays correct version' },
      ],
    },
  },
  {
    id: 'design_controls',
    name: 'Design Controls',
    features: ['V-Model', 'Traceability Matrix', 'DHF', 'BOM'],
    processRisk: 'high',
    softwareRisk: 'high',
    coreDependencies: ['auth_rls', 'global_schema', 'traceability_engine', 'variant_inheritance'],
    sopNumbers: ['SOP-005', 'SOP-006', 'SOP-007', 'SOP-008', 'SOP-009', 'SOP-010', 'SOP-011', 'SOP-012', 'SOP-019', 'SOP-027', 'SOP-028', 'SOP-029', 'SOP-031', 'SOP-049'],
    isoClauseRefs: ['7.3.1', '7.3.2', '7.3.3', '7.3.4', '7.3.5', '7.3.6', '7.3.7'],
    intendedUse: 'Manage the full design control process from user needs through design verification and validation, maintaining traceability across all design artifacts.',
    boundaryNotes: 'Includes V-Model management, design input/output traceability, DHF assembly, and BOM management. Excludes CAD file rendering and physical prototype tracking.',
    acceptanceCriteria: {
      iq: 'V-Model, Traceability Matrix, DHF, and BOM modules are installed and match the vendor feature specification.',
      oq: 'Design input-to-output traceability links are maintained without exception across all artifact types. BOM revisions propagate correctly.',
      pq: 'Design control workflows perform reliably in production with full traceability integrity over the defined test period.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to V-Model view for a product', expectedResult: 'V-Model diagram loads showing design phases' },
        { step: 'Open the Traceability Matrix', expectedResult: 'Matrix displays with rows and columns for design artifacts' },
        { step: 'Access the DHF section', expectedResult: 'Design History File structure is visible with document categories' },
      ],
      oq: [
        { step: 'Create a design input requirement and link it to a design output', expectedResult: 'Traceability link is created and visible in the matrix' },
        { step: 'Create a BOM revision and add components', expectedResult: 'BOM revision is created with correct version numbering' },
        { step: 'Verify traceability from user need → design input → design output → verification', expectedResult: 'Full chain is visible in the traceability matrix without gaps' },
        { step: 'Modify a design input and check impact analysis', expectedResult: 'Downstream affected items are highlighted' },
      ],
      pq: [
        { step: 'Trace a real requirement from user need through to verification result', expectedResult: 'Complete traceability chain is intact and auditable' },
        { step: 'Generate a DHF summary report', expectedResult: 'Report includes all design artifacts with current status' },
        { step: 'Verify BOM revision history shows all changes', expectedResult: 'Change log is complete with who/what/when' },
      ],
    },
  },
  {
    id: 'risk_management',
    name: 'Risk Management',
    features: ['Risk Matrix', 'Hazard Log', 'FMEA', 'Risk Controls'],
    processRisk: 'high',
    softwareRisk: 'high',
    coreDependencies: ['auth_rls', 'global_schema', 'variant_inheritance', 'traceability_engine'],
    sopNumbers: ['SOP-007', 'SOP-015', 'SOP-026', 'SOP-040', 'SOP-047'],
    isoClauseRefs: ['7.1', '7.3.3', '14971'],
    intendedUse: 'Identify, evaluate, control, and monitor risks throughout the product lifecycle per ISO 14971, with traceability to design controls and post-market data.',
    boundaryNotes: 'Includes risk analysis, evaluation, control, and residual risk assessment. Excludes clinical risk-benefit analysis (covered by Post-Market).',
    acceptanceCriteria: {
      iq: 'Risk Matrix, Hazard Log, FMEA, and Risk Controls modules are installed and accessible per vendor specification.',
      oq: 'Risk scores calculate correctly per the defined matrix. Hazard-to-control traceability links are maintained without exception.',
      pq: 'Risk management workflows perform reliably in production. All risk control measures are traceable to their source hazards.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Risk Management module', expectedResult: 'Risk Matrix, Hazard Log, and FMEA views are accessible' },
        { step: 'Verify Risk Controls section is present', expectedResult: 'Risk controls list is displayed' },
      ],
      oq: [
        { step: 'Add a hazard to the Hazard Log', expectedResult: 'Hazard is created with severity and probability fields' },
        { step: 'Create risk control measures linked to a hazard', expectedResult: 'Control-to-hazard traceability is maintained' },
        { step: 'Verify risk score calculation in the Risk Matrix', expectedResult: 'Score calculates correctly per the defined severity × probability matrix' },
        { step: 'Run FMEA and verify RPN calculation', expectedResult: 'RPN values compute correctly for each failure mode' },
      ],
      pq: [
        { step: 'Review a real product risk file with your team', expectedResult: 'All hazards, controls, and residual risks are visible and traceable' },
        { step: 'Verify that risk control verification links to test evidence', expectedResult: 'Each control references verification evidence or test results' },
        { step: 'Generate risk management summary report', expectedResult: 'Report includes all hazards, controls, and residual risk levels' },
      ],
    },
  },
  {
    id: 'production_supply',
    name: 'Production & Supply Chain',
    features: ['BOM', 'Supplier Management', 'Design Transfer', 'Labels'],
    processRisk: 'high',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'global_schema'],
    sopNumbers: ['SOP-009', 'SOP-010', 'SOP-016', 'SOP-020', 'SOP-021', 'SOP-030'],
    isoClauseRefs: ['7.5.1', '7.5.2', '7.4.1', '7.4.2', '7.4.3'],
    intendedUse: 'Manage bill of materials, supplier qualification and monitoring, design transfer activities, and device labeling requirements.',
    boundaryNotes: 'Includes supplier criticality assessment, BOM revision control, and label management. Excludes physical inventory management and ERP integration.',
    acceptanceCriteria: {
      iq: 'BOM, Supplier Management, Design Transfer, and Labels modules are installed and match vendor specification.',
      oq: 'BOM revisions propagate correctly. Supplier qualification workflows execute without data loss. Label templates render accurately.',
      pq: 'Production and supply chain workflows perform reliably in the production environment over the defined test period.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to BOM Management', expectedResult: 'BOM list loads with product filter options' },
        { step: 'Open Supplier Management module', expectedResult: 'Supplier list is displayed with qualification status' },
        { step: 'Access Labels module', expectedResult: 'Label templates are visible and editable' },
      ],
      oq: [
        { step: 'Create a new BOM revision with at least 3 components', expectedResult: 'BOM revision is created with correct line items and costs' },
        { step: 'Add a supplier and complete the qualification workflow', expectedResult: 'Supplier status updates to qualified with recorded evidence' },
        { step: 'Generate a label from a template', expectedResult: 'Label renders correctly with all required regulatory fields' },
      ],
      pq: [
        { step: 'Complete a design transfer checklist for a real product', expectedResult: 'All transfer steps are recorded with evidence' },
        { step: 'Verify supplier monitoring alerts are functioning', expectedResult: 'Overdue re-evaluations trigger visible alerts' },
        { step: 'Print or export a device label for review', expectedResult: 'Label matches regulatory requirements for the target market' },
      ],
    },
    infrastructureDependencies: [
      { assetId: 'FAC-002', assetName: 'Cleanroom Suite CR-100', reason: 'Production environment for device assembly' },
      { assetId: 'FAC-003', assetName: 'Shenzhen Assembly Plant', reason: 'Manufacturing facility for production processes' },
    ],
  },
  {
    id: 'capa_complaints',
    name: 'CAPA & Complaints',
    features: ['CAPA Module', 'Complaints', 'Non-Conformances'],
    processRisk: 'high',
    softwareRisk: 'high',
    coreDependencies: ['auth_rls', 'global_schema', 'audit_ledger', 'traceability_engine'],
    sopNumbers: ['SOP-028', 'SOP-032', 'SOP-033', 'SOP-042', 'SOP-044'],
    isoClauseRefs: ['8.5.2', '8.5.3', '8.3'],
    intendedUse: 'Record, investigate, and resolve corrective/preventive actions, customer complaints, and non-conformances with full audit trail and effectiveness verification.',
    boundaryNotes: 'Includes CAPA lifecycle, complaint intake and investigation, NC disposition. Excludes field safety corrective actions (covered by Post-Market Vigilance).',
    acceptanceCriteria: {
      iq: 'CAPA, Complaints, and Non-Conformance modules are installed and accessible per vendor specification.',
      oq: 'CAPA lifecycle transitions execute correctly. Complaint-to-CAPA linkage is maintained. Effectiveness verification workflows complete without exception.',
      pq: 'CAPA and complaint processes perform reliably in production with full audit trail integrity.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to CAPA Module', expectedResult: 'CAPA list loads with status filters' },
        { step: 'Open Complaints section', expectedResult: 'Complaint intake form is accessible' },
        { step: 'Check Non-Conformances module', expectedResult: 'NC records are listed with disposition status' },
      ],
      oq: [
        { step: 'Create a new CAPA record and progress through investigation → implementation → verification', expectedResult: 'CAPA lifecycle transitions execute correctly with audit trail' },
        { step: 'Create a complaint and link it to a CAPA', expectedResult: 'Complaint-to-CAPA traceability is maintained' },
        { step: 'Complete an effectiveness verification on a CAPA', expectedResult: 'Verification evidence is recorded and CAPA can be closed' },
      ],
      pq: [
        { step: 'Process a real complaint through the full workflow (intake → investigation → CAPA → closure)', expectedResult: 'All stages complete with timestamps and user signatures' },
        { step: 'Generate a CAPA metrics report', expectedResult: 'Report shows open/closed counts, aging, and trend data' },
        { step: 'Verify audit trail completeness for a closed CAPA', expectedResult: 'Every state transition is logged with user, date, and reason' },
      ],
    },
  },
  {
    id: 'training',
    name: 'Training',
    features: ['Training Modules', 'Competency Radar', 'Training Matrix', 'Training Records'],
    processRisk: 'medium',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'global_schema'],
    sopNumbers: ['SOP-004'],
    isoClauseRefs: ['6.2'],
    intendedUse: 'Assign, track, and verify personnel training and competency requirements across the organization.',
    boundaryNotes: 'Includes training assignment, completion tracking, competency assessment. Excludes LMS content hosting and external certification verification.',
    acceptanceCriteria: {
      iq: 'Training Modules, Competency Radar, Training Matrix, and Records features are installed per vendor specification.',
      oq: 'Training assignments propagate to the correct users. Competency assessments calculate correctly. Training matrix reflects current status.',
      pq: 'Training workflows perform reliably in production. All training records are complete and auditable.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Training Modules section', expectedResult: 'Training module list is displayed' },
        { step: 'Open Training Matrix view', expectedResult: 'Matrix shows personnel vs. training requirements' },
        { step: 'Check Competency Radar feature', expectedResult: 'Competency visualization loads for a selected user' },
      ],
      oq: [
        { step: 'Assign a training module to a user', expectedResult: 'Training appears in the user\'s assignment list with due date' },
        { step: 'Complete a training module and record the result', expectedResult: 'Training status updates to complete with recorded date' },
        { step: 'Verify Training Matrix reflects the completion', expectedResult: 'Matrix cell updates to show completed status' },
      ],
      pq: [
        { step: 'Assign and complete training for a real SOP with your team', expectedResult: 'All assigned users show completed status in the matrix' },
        { step: 'Generate a training records report for an upcoming audit', expectedResult: 'Report lists all personnel, assigned training, and completion dates' },
        { step: 'Verify overdue training alerts appear for unfinished assignments', expectedResult: 'Overdue items are flagged in the dashboard' },
      ],
    },
  },
  {
    id: 'regulatory',
    name: 'Regulatory',
    features: ['Submissions', 'Technical Files', 'Classification'],
    processRisk: 'medium',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'global_schema', 'audit_ledger'],
    sopNumbers: ['SOP-034', 'SOP-035', 'SOP-036', 'SOP-037', 'SOP-038', 'SOP-045', 'SOP-046', 'SOP-048'],
    isoClauseRefs: ['4.1.1', '7.3.7'],
    intendedUse: 'Manage regulatory submission workflows, technical file assembly, and device classification across multiple jurisdictions.',
    boundaryNotes: 'Includes submission tracking, technical file structure, classification guidance. Excludes direct regulatory authority portal submission.',
    acceptanceCriteria: {
      iq: 'Submissions, Technical Files, and Classification modules are installed and accessible per vendor specification.',
      oq: 'Submission workflows execute correctly across jurisdictions. Technical file assembly includes all required sections. Classification logic matches regulatory rules.',
      pq: 'Regulatory workflows perform reliably in production across all configured jurisdictions.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Regulatory Submissions', expectedResult: 'Submissions list loads with jurisdiction filters' },
        { step: 'Access Technical Files section', expectedResult: 'Technical file structure is displayed' },
        { step: 'Open Device Classification tool', expectedResult: 'Classification rules engine is accessible' },
      ],
      oq: [
        { step: 'Create a new regulatory submission record', expectedResult: 'Submission is created with correct jurisdiction and type' },
        { step: 'Assemble a technical file by linking required documents', expectedResult: 'All required sections are populated and gaps are highlighted' },
        { step: 'Run device classification for a product', expectedResult: 'Classification result matches expected regulatory rules' },
      ],
      pq: [
        { step: 'Prepare a real technical file for a product across two jurisdictions', expectedResult: 'Both files contain jurisdiction-specific required sections' },
        { step: 'Track a submission through status updates', expectedResult: 'Timeline reflects all status changes with dates' },
        { step: 'Verify classification output against your regulatory strategy', expectedResult: 'Classification aligns with intended market and device type' },
      ],
    },
  },
  {
    id: 'post_market',
    name: 'Post-Market Surveillance',
    features: ['PMS Plans', 'Vigilance', 'Clinical Evaluation', 'PMCF'],
    processRisk: 'high',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'global_schema', 'variant_inheritance'],
    sopNumbers: ['SOP-013', 'SOP-014', 'SOP-022', 'SOP-037', 'SOP-038'],
    isoClauseRefs: ['8.2.1', '8.2.2', '8.2.3'],
    intendedUse: 'Plan and execute post-market surveillance activities including vigilance reporting, clinical evaluation updates, and PMCF study management.',
    boundaryNotes: 'Includes PMS planning, vigilance event management, CER/PMCF tracking. Excludes clinical data analysis tools and statistical processing.',
    acceptanceCriteria: {
      iq: 'PMS Plans, Vigilance, Clinical Evaluation, and PMCF modules are installed per vendor specification.',
      oq: 'Vigilance reporting timelines are enforced correctly. Clinical evaluation links to post-market data without exception.',
      pq: 'Post-market surveillance workflows perform reliably in production over the defined test period.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to PMS Plans', expectedResult: 'PMS plan list is accessible' },
        { step: 'Open Vigilance module', expectedResult: 'Vigilance event list loads' },
        { step: 'Access Clinical Evaluation section', expectedResult: 'CER and PMCF sections are present' },
      ],
      oq: [
        { step: 'Create a vigilance event report', expectedResult: 'Event is recorded with severity, timeline, and reporting obligations' },
        { step: 'Link a vigilance event to a PMS plan', expectedResult: 'Event appears in the PMS plan\'s event log' },
        { step: 'Verify reporting deadline calculations', expectedResult: 'Deadlines match regulatory requirements (e.g., 15-day serious event)' },
      ],
      pq: [
        { step: 'Enter a real or simulated vigilance event and process it end-to-end', expectedResult: 'Event flows through triage → investigation → report with all fields captured' },
        { step: 'Review a PMS plan and verify data sources are linked', expectedResult: 'Plan references complaints, literature, and clinical data' },
        { step: 'Generate a periodic safety update report (PSUR/PMSR)', expectedResult: 'Report contains all required data sections per regulation' },
      ],
    },
  },
  {
    id: 'audit_review',
    name: 'Audit & Management Review',
    features: ['Internal Audit', 'Management Review', 'Gap Analysis'],
    processRisk: 'medium',
    softwareRisk: 'medium',
    coreDependencies: ['auth_rls', 'audit_ledger'],
    sopNumbers: ['SOP-003', 'SOP-050'],
    isoClauseRefs: ['8.2.4', '5.6'],
    intendedUse: 'Plan and conduct internal audits, management reviews, and regulatory gap analyses with finding tracking and CAPA linkage.',
    boundaryNotes: 'Includes audit scheduling, finding management, management review records. Excludes external auditor portal access.',
    acceptanceCriteria: {
      iq: 'Internal Audit, Management Review, and Gap Analysis modules are installed and accessible per vendor specification.',
      oq: 'Audit finding-to-CAPA linkage is maintained. Management review records capture all required inputs. Gap analysis identifies applicable clauses.',
      pq: 'Audit and review workflows perform reliably in production with complete finding traceability.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Internal Audit module', expectedResult: 'Audit schedule and list are accessible' },
        { step: 'Open Management Review section', expectedResult: 'Management review records are listed' },
        { step: 'Access Gap Analysis tool', expectedResult: 'Gap analysis questionnaire loads with applicable standards' },
      ],
      oq: [
        { step: 'Create an internal audit and add findings', expectedResult: 'Audit is created with findings linked to clauses' },
        { step: 'Link an audit finding to a CAPA', expectedResult: 'Finding-to-CAPA traceability is maintained' },
        { step: 'Complete a management review record with all required inputs', expectedResult: 'Record captures quality objectives, audit results, and action items' },
      ],
      pq: [
        { step: 'Conduct a real internal audit cycle (plan → execute → findings → follow-up)', expectedResult: 'All stages are recorded with evidence and timelines' },
        { step: 'Run a gap analysis against ISO 13485', expectedResult: 'Gaps are identified with recommendations and linked to improvement actions' },
        { step: 'Generate an audit summary report', expectedResult: 'Report includes findings, CAPAs raised, and closure status' },
      ],
    },
  },
  {
    id: 'infrastructure_csv',
    name: 'Infrastructure & CSV',
    features: ['Facilities', 'Equipment', 'Calibration', 'Computer System Validation'],
    processRisk: 'low',
    softwareRisk: 'low',
    coreDependencies: ['auth_rls'],
    sopNumbers: ['SOP-017', 'SOP-018', 'SOP-023', 'SOP-024', 'SOP-025', 'SOP-039', 'SOP-041'],
    isoClauseRefs: ['6.3', '6.4', '7.6'],
    intendedUse: 'Register and track infrastructure assets including facilities, equipment, calibration schedules, and computer system validation records.',
    boundaryNotes: 'Includes asset registry, calibration tracking, CSV record management. Excludes physical maintenance execution and IoT sensor integration.',
    acceptanceCriteria: {
      iq: 'Facilities, Equipment, Calibration, and CSV features are installed and match vendor specification.',
      oq: 'Asset registration workflows execute correctly. Calibration schedules trigger alerts on time. CSV records link to the correct assets.',
      pq: 'Infrastructure management workflows perform reliably in production over the defined test period.',
    },
    testSteps: {
      iq: [
        { step: 'Navigate to Facilities registry', expectedResult: 'Facility list loads with status indicators' },
        { step: 'Open Equipment management', expectedResult: 'Equipment list is displayed with calibration status' },
        { step: 'Access Calibration schedules', expectedResult: 'Calibration calendar and upcoming due dates are shown' },
      ],
      oq: [
        { step: 'Register a new equipment asset', expectedResult: 'Asset is created with serial number, location, and calibration interval' },
        { step: 'Record a calibration event for an instrument', expectedResult: 'Calibration record is saved with result, certificate number, and next due date' },
        { step: 'Verify calibration due-date alerts trigger correctly', expectedResult: 'Overdue and upcoming calibrations are flagged in the dashboard' },
      ],
      pq: [
        { step: 'Register your real equipment and record calibration data', expectedResult: 'All assets reflect current calibration status' },
        { step: 'Generate a calibration status report', expectedResult: 'Report lists all instruments with last calibration and next due date' },
        { step: 'Verify CSV records link to the correct infrastructure assets', expectedResult: 'Each CSV record references the validated system/asset' },
      ],
    },
    infrastructureDependencies: [
      { assetId: 'EQP-004', assetName: 'Particle Counter PC-3400', reason: 'Environmental monitoring for cleanroom qualification' },
    ],
  },
];
