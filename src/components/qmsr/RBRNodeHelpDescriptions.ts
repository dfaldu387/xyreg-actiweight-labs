/**
 * Help descriptions for each QMSR node in the Helix Process Control Map.
 * Updated for the 5-rung, 3-track Triple-Helix architecture.
 */

export interface HelixNodeHelp {
  title: string;
  shortDescription: string;
  fullDescription: string;
  whyItMatters: string;
  qmsConnection: string;
  level: 'company' | 'device';
  relatedNodes: string[];
  exampleActivities: string[];
}

export const HELIX_NODE_HELP: Record<string, HelixNodeHelp> = {
  // ============ RUNG 1: Company Foundation ============
  'mgmt-resp': {
    title: 'Management Responsibility',
    shortDescription: 'Quality policy, objectives, and executive commitment to the QMS.',
    fullDescription: 'Establishes the framework for quality management through defined policies, quality objectives, management reviews, and organizational responsibilities. This is the "roof" of your QMS house.',
    whyItMatters: 'ISO 13485 Clause 5 requires top management to demonstrate commitment. Auditors look for evidence that leadership is actively engaged, not just signing off. This node ensures your QMS has the executive support it needs.',
    qmsConnection: 'Links to Quality Manual, Quality Policy, Management Review records, and Organizational Charts. Drives the quality objectives that flow down to all other nodes.',
    level: 'company',
    relatedNodes: ['Resource Strategy', 'CAPA Loop', 'Post-Market Surveillance'],
    exampleActivities: [
      'Annual management review meetings with documented minutes',
      'Quality policy updates and communication',
      'Appointment of quality management representatives'
    ]
  },

  'resource-strategy': {
    title: 'Resource Strategy',
    shortDescription: 'Provision of competent personnel, infrastructure, and work environment.',
    fullDescription: 'Ensures adequate resources are available for QMS effectiveness, including competent personnel, appropriate infrastructure, and controlled work environments. Includes Training Effectiveness rationales.',
    whyItMatters: 'Clause 6 requires demonstrated competence, not just training records. The Training Effectiveness RBR shows auditors you verify training actually works, not just that attendance was logged.',
    qmsConnection: 'Links to Training Records, Competency Assessments, Job Descriptions, and Infrastructure Qualification records. Connects to CAPA when training gaps are identified.',
    level: 'company',
    relatedNodes: ['Infrastructure & Training', 'Design Inputs', 'CAPA Loop'],
    exampleActivities: [
      'Competency assessments with practical demonstrations',
      'Training effectiveness evaluations',
      'Resource planning for new product development'
    ]
  },

  'infra-training': {
    title: 'Infrastructure & Training',
    shortDescription: 'Physical facilities, equipment, and personnel development systems.',
    fullDescription: 'Manages the infrastructure needed for product realization and the training systems that ensure personnel competence. This is the operational foundation that supports all device-level activities.',
    whyItMatters: 'Your infrastructure and trained workforce are the "factory floor" of your QMS. Without proper facilities and competent people, device-level activities cannot succeed.',
    qmsConnection: 'Links to Equipment Qualification records, Facility layouts, Training Matrices, and SOPs. Supports Supplier Selection and Production activities.',
    level: 'company',
    relatedNodes: ['Resource Strategy', 'Supplier Selection', 'Production & Monitoring'],
    exampleActivities: [
      'Equipment qualification and calibration programs',
      'Training program development and tracking',
      'Work environment monitoring and controls'
    ]
  },

  // ============ RUNG 2: Device Upstream ============
  'reg-planning': {
    title: 'Regulatory Planning',
    shortDescription: 'Regulatory pathway selection and submission strategy.',
    fullDescription: 'Defines the regulatory strategy for each device including classification, pathway selection (510(k), De Novo, CE marking route), and submission planning. The Pathway Selection RBR documents why the chosen route is appropriate.',
    whyItMatters: 'Choosing the wrong pathway wastes months of effort. Your rationale demonstrates due diligence in pathway selection, considering all options and documenting WHY the chosen approach is optimal.',
    qmsConnection: 'Links to Regulatory Strategy documents, predicate analysis, Essential Requirements checklists, and submission timelines. Foundation for all downstream regulatory activities.',
    level: 'device',
    relatedNodes: ['Risk Management', 'V&V Testing', 'Post-Market Surveillance'],
    exampleActivities: [
      'Device classification analysis',
      'Predicate device identification and comparison',
      'Regulatory submission timeline planning'
    ]
  },

  'design-inputs': {
    title: 'Design Inputs',
    shortDescription: 'User needs and design requirements that drive development.',
    fullDescription: 'Captures and documents the requirements that will drive the design, including user needs, intended use, functional specifications, safety requirements, and regulatory requirements.',
    whyItMatters: 'Poor design inputs lead to poor designs. This node ensures you start with clear, complete, and verifiable requirements that can be traced through development to verification.',
    qmsConnection: 'Links to User Needs documents, Design Input Specifications, Requirements Traceability Matrix, and Risk Analysis inputs. Drives Design & Development activities.',
    level: 'device',
    relatedNodes: ['Design & Development', 'Regulatory Planning', 'Supplier Selection'],
    exampleActivities: [
      'User needs elicitation and documentation',
      'Design input requirements specification',
      'Regulatory requirements mapping'
    ]
  },

  'supplier-selection': {
    title: 'Supplier Selection',
    shortDescription: 'Supplier evaluation, qualification, and risk-based classification.',
    fullDescription: 'Evaluates and qualifies suppliers based on their ability to supply conforming product. The Supplier Criticality RBR documents the risk-based classification and corresponding control level.',
    whyItMatters: 'ISO 13485 requires supplier controls proportionate to risk. Auditors will ask WHY a supplier is or isn\'t considered critical, and why your audit frequency is appropriate.',
    qmsConnection: 'Links to Approved Supplier List, Supplier Quality Agreements, Audit Schedules, and Incoming Inspection Plans. Connects to risk assessments when supplier components affect safety.',
    level: 'device',
    relatedNodes: ['Supplier Controls', 'Design & Development', 'Production & Monitoring'],
    exampleActivities: [
      'Supplier capability assessments',
      'Criticality classification and documentation',
      'Quality agreement negotiation and execution'
    ]
  },

  // ============ RUNG 3: Device Execution ============
  'risk-mgmt': {
    title: 'Risk Management',
    shortDescription: 'Hazard analysis, risk evaluation, and control per ISO 14971.',
    fullDescription: 'Implements the risk management process throughout the product lifecycle, from initial hazard identification through post-production monitoring. Connects regulatory track to engineering track.',
    whyItMatters: 'Risk management is the backbone of medical device development. It determines test plans, controls, and post-market activities. Without robust risk management, your entire QMS lacks foundation.',
    qmsConnection: 'Links to Risk Management File, FMEA/FTA documents, Risk Control measures, and residual risk evaluation. Drives V&V requirements and post-market surveillance scope.',
    level: 'device',
    relatedNodes: ['V&V Testing', 'Design & Development', 'Post-Market Surveillance'],
    exampleActivities: [
      'Hazard identification and analysis sessions',
      'Risk estimation and evaluation',
      'Risk control measure implementation and verification'
    ]
  },

  'design-dev': {
    title: 'Design & Development',
    shortDescription: 'Design output, review, and transfer to production.',
    fullDescription: 'Executes the design process from inputs through outputs, including design reviews, verification planning, and transfer to production. The Design Change RBR documents impact assessments for modifications.',
    whyItMatters: 'FDA and Notified Bodies scrutinize design change decisions. You must demonstrate WHY a change doesn\'t require new 510(k)/CE marking, or WHY certain re-testing is necessary.',
    qmsConnection: 'Links to Design History File, Design Review records, Design Transfer documentation, and Engineering Change Orders. May trigger updates to Risk Management File and regulatory dossiers.',
    level: 'device',
    relatedNodes: ['Design Inputs', 'Risk Management', 'Process Validation'],
    exampleActivities: [
      'Design output documentation',
      'Design review meetings and approval',
      'Design change impact assessment'
    ]
  },

  'supplier-controls': {
    title: 'Supplier Controls',
    shortDescription: 'Purchasing controls, verification, and ongoing monitoring.',
    fullDescription: 'Implements purchasing controls for qualified suppliers including purchase order requirements, incoming inspection, and supplier performance monitoring.',
    whyItMatters: 'Components from suppliers directly affect product quality. This node ensures the controls you defined during selection are actually implemented and maintained.',
    qmsConnection: 'Links to Purchase Orders, Incoming Inspection records, Supplier Corrective Action Requests (SCARs), and Supplier Performance metrics.',
    level: 'device',
    relatedNodes: ['Supplier Selection', 'Production & Monitoring', 'Design & Development'],
    exampleActivities: [
      'Incoming inspection and testing',
      'Supplier performance monitoring and trending',
      'Supplier audit execution and follow-up'
    ]
  },

  // ============ RUNG 4: Device Verification ============
  'vv-testing': {
    title: 'Verification & Validation',
    shortDescription: 'Design verification, validation, and clinical evaluation.',
    fullDescription: 'Demonstrates the design meets specifications (verification) and user needs (validation). The Statistical Rationale RBR documents sample size justification for all testing activities.',
    whyItMatters: 'Regulatory bodies expect sample sizes based on statistical principles, not arbitrary numbers. Your rationale proves you chose sample sizes that balance confidence level, risk, and practical constraints.',
    qmsConnection: 'Links to V&V protocols and reports, Design Verification Matrix, Clinical Evaluation Reports, and usability testing documentation. Supports regulatory submissions.',
    level: 'device',
    relatedNodes: ['Risk Management', 'Process Validation', 'Post-Market Surveillance'],
    exampleActivities: [
      'Verification testing per specifications',
      'Validation testing in simulated use conditions',
      'Statistical sample size justification'
    ]
  },

  'process-validation': {
    title: 'Process Validation',
    shortDescription: 'Validation of production and service provision processes.',
    fullDescription: 'Validates processes whose output cannot be fully verified by inspection, using IQ/OQ/PQ methodology. The Validation Approach RBR documents why the chosen validation level is appropriate.',
    whyItMatters: 'Under ISO 13485 and FDA QMSR, you must demonstrate that critical processes are validated. Your rationale explains WHY the chosen validation approach is appropriate for each process risk level.',
    qmsConnection: 'Links to Process Validation Master Plan, IQ/OQ/PQ protocols and reports, Process Capability studies, and Equipment Qualification records.',
    level: 'device',
    relatedNodes: ['Design & Development', 'V&V Testing', 'Production & Monitoring'],
    exampleActivities: [
      'Process capability studies',
      'IQ/OQ/PQ protocol development and execution',
      'Validation approach justification'
    ]
  },

  'production-monitoring': {
    title: 'Production & Monitoring',
    shortDescription: 'Production controls, identification, and traceability.',
    fullDescription: 'Controls production and service provision including work instructions, in-process inspection, identification, traceability, and monitoring of production equipment and environment.',
    whyItMatters: 'This is where your QMS meets the product. All upstream activities culminate in controlled production that consistently produces conforming devices.',
    qmsConnection: 'Links to Work Instructions, Device Master Record, Production Records, Traceability systems, and Process Monitoring data. Feeds Post-Market Surveillance.',
    level: 'device',
    relatedNodes: ['Process Validation', 'Supplier Controls', 'CAPA Loop'],
    exampleActivities: [
      'In-process inspection and testing',
      'Production record maintenance',
      'Equipment monitoring and calibration'
    ]
  },

  // ============ RUNG 5: Company Feedback ============
  'pms': {
    title: 'Post-Market Surveillance',
    shortDescription: 'Feedback collection, complaint handling, and PMCF/PMPF.',
    fullDescription: 'Collects and analyzes post-market data including complaints, field feedback, adverse events, and clinical follow-up. The Clinical Evaluation RBR documents the clinical evidence strategy.',
    whyItMatters: 'MDR/IVDR and FDA increasingly require robust clinical evidence and proactive surveillance. Your rationale proves you\'ve thought through evidence needs and planned appropriate activities.',
    qmsConnection: 'Links to PMS Plan, Complaint files, PMCF/PMPF plans, Periodic Safety Update Reports, and trend analysis. Feeds into CAPA and Risk Management updates.',
    level: 'company',
    relatedNodes: ['CAPA Loop', 'Risk Management', 'V&V Testing'],
    exampleActivities: [
      'Complaint investigation and trending',
      'Post-market clinical follow-up studies',
      'Vigilance reporting and analysis'
    ]
  },

  'capa-loop': {
    title: 'CAPA Loop',
    shortDescription: 'Corrective and preventive action system for continuous improvement.',
    fullDescription: 'Investigates root causes and implements systemic corrections to prevent recurrence. The CAPA Priority RBR documents escalation decisions for quality events.',
    whyItMatters: 'FDA 483s frequently cite inadequate CAPA decisions. Your rationale demonstrates risk-based thinking: WHY this issue warrants investigation, or WHY a simple correction addresses the root cause.',
    qmsConnection: 'Links to CAPA records, NCR files, Audit findings, Complaint investigations, and Effectiveness reviews. Triggers updates across the QMS.',
    level: 'company',
    relatedNodes: ['Post-Market Surveillance', 'Management Responsibility', 'Resource Strategy'],
    exampleActivities: [
      'Root cause analysis using appropriate methodology',
      'Corrective/preventive action implementation',
      'Effectiveness verification and closure'
    ]
  },
};

// Legacy RBR help (for backward compatibility)
export interface RBRNodeHelp {
  title: string;
  shortDescription: string;
  fullDescription: string;
  whyItMatters: string;
  qmsConnection: string;
  relatedNodes: string[];
  exampleDecisions: string[];
}

export const RBR_NODE_HELP: Record<string, RBRNodeHelp> = {
  'RBR-ENG': {
    title: 'Process Validation',
    shortDescription: 'Documents why manufacturing processes are validated to the chosen extent.',
    fullDescription: 'Process Validation rationales justify the level of validation applied to manufacturing and production processes.',
    whyItMatters: 'Under ISO 13485:2016 and FDA QMSR, you must demonstrate that processes producing output that cannot be fully verified by inspection are validated.',
    qmsConnection: 'Links to Process Validation Master Plans, IQ/OQ/PQ protocols, and risk assessments.',
    relatedNodes: ['RBR-SAM (Sample Size)', 'RBR-DCH (Design Change)'],
    exampleDecisions: [
      'Why IQ/OQ/PQ is required for sterilization but not for packaging',
      'Why 3 consecutive successful batches meets validation criteria'
    ]
  },
  'RBR-SAM': {
    title: 'Statistical Rationale',
    shortDescription: 'Documents the statistical basis for test sample quantities.',
    fullDescription: 'Sample Size rationales justify why the number of samples chosen for testing is statistically appropriate.',
    whyItMatters: 'Regulatory bodies expect sample sizes to be based on statistical principles, not arbitrary numbers.',
    qmsConnection: 'Links to Design Verification protocols, Process Validation protocols, and Sampling Plans.',
    relatedNodes: ['RBR-ENG (Process Validation)', 'RBR-CLE (Clinical Evaluation)'],
    exampleDecisions: [
      'Why n=30 samples for performance testing based on AQL requirements',
      'Why usability validation requires 15 participants per user group'
    ]
  },
  'RBR-SUP': {
    title: 'Supplier Criticality',
    shortDescription: 'Documents why suppliers are classified at specific criticality levels.',
    fullDescription: 'Supplier Criticality rationales justify the risk-based classification of suppliers.',
    whyItMatters: 'ISO 13485 requires supplier controls proportionate to risk.',
    qmsConnection: 'Links to Approved Supplier List, Supplier Quality Agreements, and Audit Schedules.',
    relatedNodes: ['RBR-ENG (Process Validation)', 'RBR-DCH (Design Change)'],
    exampleDecisions: [
      'Why PCB manufacturer is classified as critical vs. label printer as non-critical',
      'Why annual audits are required for critical suppliers'
    ]
  },
  'RBR-DCH': {
    title: 'Design Change',
    shortDescription: 'Documents the impact assessment for design changes.',
    fullDescription: 'Design Change rationales justify the categorization of changes and required activities.',
    whyItMatters: 'FDA and Notified Bodies scrutinize design change decisions.',
    qmsConnection: 'Links to Design History File, Change Control Records, and V&V protocols.',
    relatedNodes: ['RBR-CLE (Clinical Evaluation)', 'RBR-REG (Pathway Selection)'],
    exampleDecisions: [
      'Why firmware update v2.1 is a minor change not requiring new 510(k)',
      'Why component substitution requires only design verification'
    ]
  },
  'RBR-REG': {
    title: 'Pathway Selection',
    shortDescription: 'Documents the rationale for chosen regulatory submission strategy.',
    fullDescription: 'Pathway Selection rationales justify which regulatory route to pursue.',
    whyItMatters: 'Choosing the wrong pathway wastes months of effort.',
    qmsConnection: 'Links to Regulatory Strategy documents and predicate analysis.',
    relatedNodes: ['RBR-CLE (Clinical Evaluation)', 'RBR-DCH (Design Change)'],
    exampleDecisions: [
      'Why 510(k) with predicate X is preferred over De Novo',
      'Why Class IIa self-certification route is appropriate under EU MDR'
    ]
  },
  'RBR-CLE': {
    title: 'Clinical Evaluation',
    shortDescription: 'Documents the approach to demonstrating clinical safety and performance.',
    fullDescription: 'Clinical Evaluation rationales justify the mix of clinical evidence sources.',
    whyItMatters: 'MDR/IVDR and FDA increasingly require robust clinical evidence.',
    qmsConnection: 'Links to Clinical Evaluation Report (CER) and PMCF/PMPF plans.',
    relatedNodes: ['RBR-REG (Pathway Selection)', 'RBR-SAM (Sample Size)'],
    exampleDecisions: [
      'Why literature review plus PMS data is sufficient without new clinical study',
      'Why equivalence to Device X is claimed for clinical data reliance'
    ]
  },
  'RBR-CAP': {
    title: 'CAPA Priority',
    shortDescription: 'Documents why issues are or aren\'t escalated to formal CAPA.',
    fullDescription: 'CAPA Priority rationales justify the decision to escalate quality events.',
    whyItMatters: 'FDA 483s frequently cite inadequate CAPA decisions.',
    qmsConnection: 'Links to CAPA records, Complaint files, and NCR records.',
    relatedNodes: ['RBR-TRN (Training Effectiveness)', 'RBR-DCH (Design Change)'],
    exampleDecisions: [
      'Why complaint pattern indicates systemic issue requiring CAPA',
      'Why NC is addressed with immediate correction only'
    ]
  },
  'RBR-TRN': {
    title: 'Training Effectiveness',
    shortDescription: 'Documents how training effectiveness is measured.',
    fullDescription: 'Training Effectiveness rationales justify the methods used to verify training works.',
    whyItMatters: 'ISO 13485 requires "appropriate education, training, skills and experience."',
    qmsConnection: 'Links to Training Records and Competency Assessments.',
    relatedNodes: ['RBR-CAP (CAPA Priority)', 'RBR-SWV (Software Validation)'],
    exampleDecisions: [
      'Why practical demonstration is required for sterilization operators',
      'Why annual retraining is needed for high-risk activities'
    ]
  },
};

// QMS Architecture Help - Overview explanation for the Triple-Helix structure
export const QMS_ARCHITECTURE_HELP = {
  overview: `The Triple-Helix QMS Map visualizes your ISO 13485:2016 compliance across five "rungs" 
and three parallel tracks: Regulatory (REG), Engineering (ENG), and Business/Management (BUS).`,
  
  companyLevel: {
    title: 'QMS Foundation',
    description: 'Company-level infrastructure that supports ALL devices.',
    metaphor: 'The "walls of the factory"',
    rungs: [
      { number: 1, name: 'Foundation', isoClause: '§5-6', description: 'Management Responsibility, Resources, Infrastructure' },
      { number: 5, name: 'Feedback (Company)', isoClause: '§8', description: 'Portfolio-wide PMS, Systemic CAPA' },
    ],
  },
  
  deviceLevel: {
    title: 'Device Process Engine',
    description: 'Device-specific development activities.',
    metaphor: 'The "assembly line"',
    rungs: [
      { number: 2, name: 'Upstream', isoClause: '§7.1, 7.3.3', description: 'Regulatory Planning, Design Inputs, Supplier Selection' },
      { number: 3, name: 'Execution', isoClause: '§7.3.4, 7.4', description: 'Risk Management, Design & Development, Supplier Controls' },
      { number: 4, name: 'Verification', isoClause: '§7.3.6-7, 7.5', description: 'V&V Testing, Process Validation, Production' },
      { number: 5, name: 'Feedback (Device)', isoClause: '§8.2', description: 'Device PMS, Device CAPA' },
    ],
  },
  
  phasesToRungsMapping: [
    { phases: ['Concept & Planning', 'Design Inputs'], rung: 2, rungName: 'Upstream' },
    { phases: ['Design & Development'], rung: 3, rungName: 'Execution' },
    { phases: ['Verification & Validation', 'Transfer & Production'], rung: 4, rungName: 'Verification' },
    { phases: ['Market & Surveillance'], rung: 5, rungName: 'Feedback' },
  ],
  
  whyItMatters: [
    'Provides auditor-ready visualization of QMS process interactions',
    'Distinguishes company-level foundation from device-specific execution',
    'Shows cross-track dependencies (REG drives ENG test plans, etc.)',
    'Enables portfolio visibility for executives while maintaining device traceability',
  ],
};

export function getRBRNodeHelp(nodeType: string): RBRNodeHelp | null {
  return RBR_NODE_HELP[nodeType] || null;
}

export function getHelixNodeHelp(nodeId: string): HelixNodeHelp | null {
  return HELIX_NODE_HELP[nodeId] || null;
}
