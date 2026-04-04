/**
 * CDSCO (India) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const CDSCO_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per Indian MDR 2017 risk classes (A, B, C, D).', fields: [
      { id: 'device_class', label: 'Indian device class', type: 'select', options: ['Class A', 'Class B', 'Class C', 'Class D'], required: true, helpText: 'Select the Indian MDR 2017 risk classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain the classification rules applied.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification determination.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — Registration / Import Licence', evidenceRequired: true, steps: [
    { id: '2_licence', stepLabel: 'Registration', requirementText: 'Obtain registration certificate or import licence from CDSCO.', fields: [
      { id: 'licence_type', label: 'Licence type', type: 'select', options: ['Registration certificate', 'Import licence', 'Both'], required: true, helpText: 'Select the applicable licence type.' },
      { id: 'licence_number', label: 'Licence/registration number', type: 'text', helpText: 'Enter once issued by CDSCO.' },
      { id: 'licence_doc', label: 'Licence application dossier', type: 'doc_reference', required: true, helpText: 'Link to the registration or import licence application.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — Authorized Indian Agent', evidenceRequired: true, steps: [
    { id: '3_agent', stepLabel: 'Agent Appointment', requirementText: 'Appoint an authorized Indian agent for foreign manufacturers.', fields: [
      { id: 'agent_name', label: 'Indian authorized agent name', type: 'text', required: true, helpText: 'Name of the appointed authorized Indian agent.' },
      { id: 'agent_agreement', label: 'Agent agreement', type: 'doc_reference', required: true, helpText: 'Link to the agent appointment agreement.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — Quality Management System', evidenceRequired: true, steps: [
    { id: '4_qms', stepLabel: 'QMS Compliance', requirementText: 'Demonstrate QMS compliance per MDR 2017 Schedule 5 or ISO 13485.', fields: [
      { id: 'qms_approach', label: 'QMS compliance approach', type: 'select', options: ['ISO 13485 certified', 'MDR 2017 Schedule 5 compliance', 'In progress'], required: true, helpText: 'Select the QMS compliance demonstration approach.' },
      { id: 'qms_doc', label: 'QMS certificate / compliance evidence', type: 'doc_reference', required: true, helpText: 'Link to the QMS certificate or compliance documentation.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — Essential Principles of Safety and Performance', evidenceRequired: true, steps: [
    { id: '5_ep', stepLabel: 'Essential Principles', requirementText: 'Demonstrate compliance with essential principles per MDR 2017 Schedule 2.', fields: [
      { id: 'ep_checklist', label: 'Essential principles compliance', type: 'richtext', required: true, helpText: 'Document compliance with each applicable principle from Schedule 2.' },
      { id: 'ep_doc', label: 'Essential principles document', type: 'doc_reference', required: true, helpText: 'Link to the compliance checklist.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Clinical Investigation / Clinical Evidence', evidenceRequired: true, steps: [
    { id: '6_clinical', stepLabel: 'Clinical Evidence', requirementText: 'Provide clinical evidence or conduct clinical investigation for Class C/D devices.', fields: [
      { id: 'clinical_approach', label: 'Clinical evidence approach', type: 'richtext', required: true, helpText: 'Describe the clinical evidence strategy for CDSCO requirements.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to clinical evaluation report or investigation data.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Indian Labelling Requirements', evidenceRequired: true, steps: [
    { id: '7_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling meets MDR 2017 Schedule 4 requirements.', fields: [
      { id: 'label_compliance', label: 'Labelling compliance', type: 'richtext', required: true, helpText: 'Confirm labelling in English (and Hindi where required) per Schedule 4.' },
      { id: 'label_specimen', label: 'Label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved label artwork.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — Post-Market Surveillance and Vigilance', evidenceRequired: true, steps: [
    { id: '8_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish adverse event reporting to CDSCO and PMS per MDR 2017.', fields: [
      { id: 'pms_procedure', label: 'PMS and vigilance procedure', type: 'richtext', required: true, helpText: 'Describe the adverse event reporting and PMS system for India.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the PMS plan.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — BIS Standards Compliance', evidenceRequired: true, steps: [
    { id: '9_bis', stepLabel: 'BIS Compliance', requirementText: 'Comply with applicable BIS standards referenced in Indian MDR 2017.', fields: [
      { id: 'bis_applicable', label: 'Applicable BIS standards', type: 'richtext', required: true, helpText: 'List applicable Bureau of Indian Standards and compliance status.' },
      { id: 'bis_doc', label: 'BIS compliance evidence', type: 'doc_reference', helpText: 'Link to test reports or BIS certification.' },
    ]},
  ]},
};
