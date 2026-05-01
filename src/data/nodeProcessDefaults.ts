/**
 * Canonical 6-block "Process Card" defaults for QMS Helix nodes.
 *
 * Each entry is a starter ("boilerplate") that the user can accept as-is via
 * a "Use this template" button or edit further. Aligned to ISO 13485:2016 and
 * 21 CFR 820 (QMSR) clauses referenced in `helixNodeConfig.ts`.
 *
 * `helpText` is shown in a contextual help popover next to the node title and
 * explains *what this node does* and why it matters for compliance.
 */

import type { ProcessStep } from '@/services/qmsNodeProcessService';

export interface NodeProcessDefault {
  /** Plain-English explanation of what this node covers. Shown in a "?" popover. */
  helpText: string;
  /** Block 1 — Purpose statement seed. */
  purpose: string;
  /** Block 2 — Inputs (resources, data, records the process consumes). */
  inputs: string[];
  /** Block 3 — Outputs (records, artefacts the process produces). */
  outputs: string[];
  /** Block 4 — Numbered process steps. */
  steps: ProcessStep[];
}

export const NODE_PROCESS_DEFAULTS: Record<string, NodeProcessDefault> = {
  'mgmt-resp': {
    helpText:
      'Top-management commitment to the QMS: quality policy, objectives, responsibilities and management review. Demonstrates leadership engagement required by ISO 13485 §5.',
    purpose:
      'Ensure top management establishes, communicates and reviews the quality policy and objectives, assigns responsibilities, and provides resources to maintain the QMS.',
    inputs: [
      'Regulatory requirements & standards',
      'Customer & stakeholder feedback',
      'Previous management review outputs',
      'Audit findings (internal/external)',
    ],
    outputs: [
      'Approved Quality Policy & Objectives',
      'Management review minutes',
      'Resource allocation decisions',
      'Assigned QMS responsibilities (org chart)',
    ],
    steps: [
      { step: 1, description: 'Review quality policy & objectives at planned intervals.' },
      { step: 2, description: 'Assign QMS roles and management representative.' },
      { step: 3, description: 'Hold management review with the standard agenda.' },
      { step: 4, description: 'Approve resource, training and improvement actions.' },
      { step: 5, description: 'Communicate decisions across the organisation.' },
    ],
  },

  'resource-strategy': {
    helpText:
      'Plan and provide the human resources, competence and training needed to operate the QMS effectively (ISO 13485 §6.2).',
    purpose:
      'Ensure personnel performing work affecting product quality are competent on the basis of education, training, skills and experience.',
    inputs: [
      'Job descriptions & competence requirements',
      'Training needs analysis',
      'Regulatory training obligations (e.g. MDR, FDA QMSR)',
      'New hire / role-change events',
    ],
    outputs: [
      'Training plan',
      'Training records & effectiveness evaluations',
      'Competence matrix',
      'Authorised signer / role assignment list',
    ],
    steps: [
      { step: 1, description: 'Define competence requirements per role.' },
      { step: 2, description: 'Identify training gaps via the competence matrix.' },
      { step: 3, description: 'Deliver training (internal/external).' },
      { step: 4, description: 'Assess training effectiveness.' },
      { step: 5, description: 'Update records and re-train as needed.' },
    ],
  },

  'infra-training': {
    helpText:
      'Provide and maintain the infrastructure (buildings, workspace, equipment, IT systems) and work environment required to achieve product conformity (ISO 13485 §6.3–6.4).',
    purpose:
      'Ensure infrastructure and work environment requirements are defined, provided, maintained and qualified where necessary to achieve product conformity.',
    inputs: [
      'Product & process requirements',
      'Equipment specifications (IQ/OQ/PQ)',
      'Cleanroom / environmental specifications',
      'IT/software validation needs (CSV, GAMP 5)',
    ],
    outputs: [
      'Qualified equipment list',
      'Calibration & maintenance records',
      'Environmental monitoring records',
      'Validated IT/software systems',
    ],
    steps: [
      { step: 1, description: 'Define infrastructure & environment requirements.' },
      { step: 2, description: 'Qualify equipment (IQ/OQ/PQ) and validate IT systems.' },
      { step: 3, description: 'Schedule preventive maintenance & calibration.' },
      { step: 4, description: 'Monitor work environment continuously.' },
      { step: 5, description: 'Address non-conformities and re-qualify when needed.' },
    ],
  },

  'design-control': {
    helpText:
      'Plan and control device design and development from concept to design transfer per ISO 13485 §7.3 / 21 CFR 820.30.',
    purpose:
      'Establish, document and maintain procedures to control the design of the device, ensuring specified requirements are met.',
    inputs: [
      'User needs & intended use',
      'Regulatory & standards requirements',
      'Risk management file',
      'Project scope & resources',
    ],
    outputs: [
      'Design & development plan',
      'Design inputs / outputs / reviews',
      'V&V results & design transfer package',
      'Design History File (DHF)',
    ],
    steps: [
      { step: 1, description: 'Plan design phases, deliverables and reviewers.' },
      { step: 2, description: 'Capture and approve design inputs.' },
      { step: 3, description: 'Generate design outputs and conduct design reviews.' },
      { step: 4, description: 'Verify and validate the design.' },
      { step: 5, description: 'Transfer to production and lock the DHF.' },
    ],
  },

  'reg-planning': {
    helpText:
      'Plan the regulatory pathway(s) and obligations across target markets early in the project to inform design and clinical strategy.',
    purpose:
      'Determine the regulatory classification, pathway, applicable standards and submission strategy for each target market.',
    inputs: [
      'Intended use & device description',
      'Target markets list',
      'Risk classification rules (MDR Annex VIII, FDA 21 CFR 860)',
      'Predicate / equivalence data',
    ],
    outputs: [
      'Regulatory strategy memo',
      'Classification rationale per market',
      'Standards applicability list',
      'Submission roadmap & timeline',
    ],
    steps: [
      { step: 1, description: 'Confirm intended use and indications.' },
      { step: 2, description: 'Determine classification per each market.' },
      { step: 3, description: 'Map applicable standards & guidance.' },
      { step: 4, description: 'Select submission pathway (e.g. 510(k), CE MDR).' },
      { step: 5, description: 'Document strategy and align with project plan.' },
    ],
  },

  'design-inputs': {
    helpText:
      'Capture user, clinical, regulatory and technical requirements that the device must meet (ISO 13485 §7.3.3).',
    purpose:
      'Establish complete, unambiguous, verifiable design inputs traceable to user needs and regulatory requirements.',
    inputs: [
      'User needs / Voice of Customer',
      'Clinical evaluation & literature',
      'Applicable standards & regulations',
      'Risk management outputs',
    ],
    outputs: [
      'Design Input Requirements (DIR) specification',
      'Traceability matrix (needs → inputs)',
      'Approved input baseline',
    ],
    steps: [
      { step: 1, description: 'Collect user needs and clinical context.' },
      { step: 2, description: 'Translate needs into measurable requirements.' },
      { step: 3, description: 'Resolve incomplete/conflicting requirements.' },
      { step: 4, description: 'Review and approve the DIR.' },
      { step: 5, description: 'Baseline and place under change control.' },
    ],
  },

  'supplier-selection': {
    helpText:
      'Evaluate and select suppliers based on their ability to meet purchasing requirements, including quality and regulatory criteria (ISO 13485 §7.4.1).',
    purpose:
      'Establish criteria and processes for evaluating, selecting and approving suppliers of products and services that affect device quality.',
    inputs: [
      'Purchasing requirements',
      'Supplier questionnaires & audits',
      'Risk classification of supplied item',
      'Historical supplier performance',
    ],
    outputs: [
      'Approved Supplier List (ASL)',
      'Quality / Supply agreements',
      'Supplier risk assessments',
      'Selection rationale records',
    ],
    steps: [
      { step: 1, description: 'Define supplier evaluation criteria & risk tier.' },
      { step: 2, description: 'Issue questionnaires and review evidence.' },
      { step: 3, description: 'Conduct on-site or remote audit if required.' },
      { step: 4, description: 'Approve and add to the ASL with quality agreement.' },
      { step: 5, description: 'Monitor performance and re-qualify periodically.' },
    ],
  },

  'risk-mgmt': {
    helpText:
      'Apply ISO 14971 risk management throughout the device lifecycle: hazard identification, risk evaluation, control and residual risk acceptability.',
    purpose:
      'Identify hazards, estimate and evaluate associated risks, control those risks, and monitor effectiveness of controls across the device lifecycle.',
    inputs: [
      'Intended use & reasonably foreseeable misuse',
      'Device characteristics & use environment',
      'Historical complaints / post-market data',
      'Applicable safety standards',
    ],
    outputs: [
      'Risk Management Plan',
      'Hazard analysis & FMEA',
      'Risk control measures & verification',
      'Risk Management Report (residual risk acceptability)',
    ],
    steps: [
      { step: 1, description: 'Establish the risk management plan.' },
      { step: 2, description: 'Identify hazards and hazardous situations.' },
      { step: 3, description: 'Estimate and evaluate risks.' },
      { step: 4, description: 'Implement and verify risk controls.' },
      { step: 5, description: 'Review residual risk and feed PMS data back.' },
    ],
  },

  'design-dev': {
    helpText:
      'Generate design outputs (drawings, specs, code, labelling) that meet design inputs and can be verified against acceptance criteria.',
    purpose:
      'Translate approved design inputs into design outputs suitable for verification, manufacture and use.',
    inputs: [
      'Approved Design Input Requirements',
      'Risk control measures',
      'Standards & regulatory constraints',
      'Manufacturing capability data',
    ],
    outputs: [
      'Drawings, BOMs, specifications',
      'Software source & build artefacts',
      'Labelling & IFU drafts',
      'Design Review minutes',
    ],
    steps: [
      { step: 1, description: 'Develop design outputs against each input.' },
      { step: 2, description: 'Hold design reviews at planned milestones.' },
      { step: 3, description: 'Update traceability matrix.' },
      { step: 4, description: 'Resolve action items from reviews.' },
      { step: 5, description: 'Release outputs for V&V.' },
    ],
  },

  'supplier-controls': {
    helpText:
      'Define and apply controls on approved suppliers proportionate to risk: incoming inspection, change notifications, performance monitoring (ISO 13485 §7.4).',
    purpose:
      'Ensure purchased product conforms to specified requirements through risk-based controls applied to approved suppliers.',
    inputs: [
      'Approved Supplier List & risk tiers',
      'Purchase orders & specifications',
      'Supplier change notifications',
      'Incoming inspection results',
    ],
    outputs: [
      'Incoming inspection records',
      'Supplier scorecards / KPIs',
      'SCARs (supplier corrective actions)',
      'Re-qualification records',
    ],
    steps: [
      { step: 1, description: 'Define inspection plan based on supplier risk.' },
      { step: 2, description: 'Receive and inspect incoming product.' },
      { step: 3, description: 'Track supplier KPIs (quality, delivery).' },
      { step: 4, description: 'Issue SCARs and follow up.' },
      { step: 5, description: 'Re-qualify or de-list as warranted.' },
    ],
  },

  'vv-testing': {
    helpText:
      'Verification confirms design outputs meet inputs; validation confirms the device meets user needs and intended use under actual or simulated use conditions.',
    purpose:
      'Plan and execute verification and validation activities to demonstrate that the device meets requirements and intended use.',
    inputs: [
      'Approved design outputs',
      'Design inputs & user needs',
      'Risk control verification needs',
      'Test method validations',
    ],
    outputs: [
      'V&V protocols & reports',
      'Test data and traceability evidence',
      'Deviations and resolutions',
      'V&V summary for the DHF',
    ],
    steps: [
      { step: 1, description: 'Author V&V plan with sample sizes & criteria.' },
      { step: 2, description: 'Validate test methods where applicable.' },
      { step: 3, description: 'Execute tests and capture raw data.' },
      { step: 4, description: 'Investigate deviations / failures.' },
      { step: 5, description: 'Report and update traceability.' },
    ],
  },

  'process-validation': {
    helpText:
      'Validate manufacturing processes whose output cannot be fully verified by subsequent inspection (IQ/OQ/PQ per GHTF/SG3).',
    purpose:
      'Demonstrate that manufacturing processes consistently produce product meeting predetermined requirements.',
    inputs: [
      'Process specifications & equipment qualifications',
      'Critical process parameters & quality attributes',
      'Risk analysis of the process',
      'Statistical sampling plan',
    ],
    outputs: [
      'IQ / OQ / PQ protocols and reports',
      'Validated process parameter ranges',
      'Master Validation Plan',
      'Re-validation triggers documented',
    ],
    steps: [
      { step: 1, description: 'Identify processes requiring validation.' },
      { step: 2, description: 'Author Master Validation Plan.' },
      { step: 3, description: 'Execute IQ, OQ, then PQ.' },
      { step: 4, description: 'Approve validated state and release for production.' },
      { step: 5, description: 'Monitor and trigger re-validation as needed.' },
    ],
  },

  'production-monitoring': {
    helpText:
      'Control routine production and service provision: work instructions, in-process monitoring, traceability and Device History Records (ISO 13485 §7.5).',
    purpose:
      'Plan and carry out production under controlled conditions and monitor process performance and product conformity.',
    inputs: [
      'Validated processes & approved BOM',
      'Work orders / batch records',
      'In-process inspection criteria',
      'Trained operators & qualified equipment',
    ],
    outputs: [
      'Device History Records (DHR)',
      'In-process monitoring data',
      'Released finished goods',
      'Non-conformance records (where applicable)',
    ],
    steps: [
      { step: 1, description: 'Issue work order against validated process.' },
      { step: 2, description: 'Execute production with in-process checks.' },
      { step: 3, description: 'Record DHR and lot/serial traceability.' },
      { step: 4, description: 'Perform final inspection and release.' },
      { step: 5, description: 'Monitor process KPIs and trends.' },
    ],
  },

  'pms': {
    helpText:
      'Systematic post-market surveillance: collect, analyse and act on field experience, complaints and literature (ISO 13485 §8.2.1, MDR Art. 83–86).',
    purpose:
      'Proactively gather and analyse data on the device in the field to maintain safety and performance throughout its lifetime.',
    inputs: [
      'PMS plan & data sources',
      'Complaints & service reports',
      'Vigilance / FSCA data',
      'Literature & registry data',
    ],
    outputs: [
      'PMS reports / PSURs',
      'Trended complaint metrics',
      'CAPA triggers',
      'Updates to risk management & clinical evaluation',
    ],
    steps: [
      { step: 1, description: 'Maintain a PMS plan for each device family.' },
      { step: 2, description: 'Collect and code data continuously.' },
      { step: 3, description: 'Trend and analyse against thresholds.' },
      { step: 4, description: 'Escalate to vigilance, CAPA, or design change.' },
      { step: 5, description: 'Author periodic PMS / PSUR reports.' },
    ],
  },

  'capa-loop': {
    helpText:
      'Corrective and Preventive Action: investigate causes of actual or potential non-conformities and implement effective actions (ISO 13485 §8.5.2–8.5.3).',
    purpose:
      'Eliminate causes of non-conformities and prevent recurrence through documented corrective and preventive actions.',
    inputs: [
      'Non-conformance records',
      'Complaints & PMS trends',
      'Audit findings',
      'Process performance data',
    ],
    outputs: [
      'CAPA records with root-cause analysis',
      'Implemented corrective/preventive actions',
      'Effectiveness checks',
      'Lessons learned communicated',
    ],
    steps: [
      { step: 1, description: 'Open CAPA from a triggering source.' },
      { step: 2, description: 'Perform root cause analysis (e.g. 5-Why, fishbone).' },
      { step: 3, description: 'Define and approve action plan.' },
      { step: 4, description: 'Implement actions and verify completion.' },
      { step: 5, description: 'Check effectiveness and close.' },
    ],
  },

  'device-pms': {
    helpText:
      'Device-specific post-market surveillance feeding the company-level PMS programme.',
    purpose:
      'Collect device-specific field data to monitor safety/performance and trigger updates to risk and clinical files.',
    inputs: [
      'Device-specific complaints',
      'Service & repair data',
      'Customer feedback',
      'Vigilance reports for this device',
    ],
    outputs: [
      'Device PMS report',
      'Updated risk management file',
      'Inputs to PSUR / Clinical Evaluation Update',
    ],
    steps: [
      { step: 1, description: 'Receive and triage device feedback.' },
      { step: 2, description: 'Investigate and code each event.' },
      { step: 3, description: 'Trend per device family / variant.' },
      { step: 4, description: 'Update risk and clinical files.' },
      { step: 5, description: 'Feed company PMS programme.' },
    ],
  },

  'device-capa': {
    helpText:
      'Device-level CAPA actions — typically triggered by device PMS, complaints or recurring non-conformities.',
    purpose:
      'Eliminate causes of device-specific non-conformities and prevent recurrence.',
    inputs: [
      'Device complaints & failures',
      'Device PMS trends',
      'Production NCRs for this device',
    ],
    outputs: [
      'Device CAPA records',
      'Design or process change requests',
      'Effectiveness checks',
    ],
    steps: [
      { step: 1, description: 'Open device CAPA from trigger.' },
      { step: 2, description: 'Root-cause analysis.' },
      { step: 3, description: 'Plan corrective + preventive actions.' },
      { step: 4, description: 'Implement and verify.' },
      { step: 5, description: 'Verify effectiveness; close.' },
    ],
  },
};

export function getNodeProcessDefault(nodeId: string): NodeProcessDefault | undefined {
  return NODE_PROCESS_DEFAULTS[nodeId];
}