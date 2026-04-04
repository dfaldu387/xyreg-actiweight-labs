/**
 * NMPA (China) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const NMPA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per NMPA rules (Class I, II, III).', fields: [
      { id: 'device_class', label: 'NMPA device class', type: 'select', options: ['Class I', 'Class II', 'Class III'], required: true, helpText: 'Select the Chinese device classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain applicable classification catalogue and rules.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification determination document.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — Registration Dossier Preparation', evidenceRequired: true, steps: [
    { id: '2_dossier', stepLabel: 'Dossier', requirementText: 'Prepare registration dossier per NMPA Order 4/6.', fields: [
      { id: 'dossier_status', label: 'Dossier preparation status', type: 'select', options: ['Complete', 'In progress', 'Not started'], required: true, helpText: 'Current status of the registration dossier.' },
      { id: 'registration_number', label: 'Registration certificate number', type: 'text', helpText: 'Enter once issued by NMPA.' },
      { id: 'dossier_doc', label: 'Registration dossier', type: 'doc_reference', required: true, helpText: 'Link to the compiled registration dossier.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — In-Country Agent / Legal Representative', evidenceRequired: true, steps: [
    { id: '3_agent', stepLabel: 'Agent Appointment', requirementText: 'Appoint an in-country agent for foreign manufacturers.', fields: [
      { id: 'agent_name', label: 'Chinese agent / legal representative name', type: 'text', required: true, helpText: 'Name of the appointed in-country agent.' },
      { id: 'agent_agreement', label: 'Agent agreement', type: 'doc_reference', required: true, helpText: 'Link to the agent appointment agreement.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — Product Technical Requirements', evidenceRequired: true, steps: [
    { id: '4_tech_req', stepLabel: 'Technical Requirements', requirementText: 'Develop product technical requirements document per NMPA guidelines.', fields: [
      { id: 'tech_req_summary', label: 'Technical requirements summary', type: 'richtext', required: true, helpText: 'Summarize performance specifications, test methods, and acceptance criteria.' },
      { id: 'tech_req_doc', label: 'Product technical requirements document', type: 'doc_reference', required: true, helpText: 'Link to the formal product technical requirements document.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — GMP / Manufacturing Quality System', evidenceRequired: true, steps: [
    { id: '5_gmp', stepLabel: 'GMP Compliance', requirementText: 'Demonstrate GMP compliance per Chinese requirements.', fields: [
      { id: 'gmp_status', label: 'GMP audit status', type: 'select', options: ['Passed', 'Scheduled', 'Not required', 'Not started'], required: true, helpText: 'Status of NMPA GMP audit.' },
      { id: 'gmp_report', label: 'GMP audit report', type: 'doc_reference', helpText: 'Link to the GMP audit report from NMPA or recognized body.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Clinical Evaluation / Clinical Trials', evidenceRequired: true, steps: [
    { id: '6_clinical', stepLabel: 'Clinical Evidence', requirementText: 'Provide clinical evaluation or conduct clinical trials in China for Class III or novel devices.', fields: [
      { id: 'clinical_approach', label: 'Clinical evidence approach', type: 'richtext', required: true, helpText: 'Describe use of Chinese clinical trials, exemption pathway, or equivalent device comparison.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to clinical evaluation report or clinical trial data.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Chinese Labelling Requirements', evidenceRequired: true, steps: [
    { id: '7_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling in Simplified Chinese.', fields: [
      { id: 'label_compliance', label: 'Chinese labelling compliance', type: 'richtext', required: true, helpText: 'Confirm Simplified Chinese labelling includes: manufacturer, specifications, intended use, warnings, registration number.' },
      { id: 'label_specimen', label: 'Chinese label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved Chinese-language label artwork.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — Type Testing at Chinese Labs', evidenceRequired: true, steps: [
    { id: '8_testing', stepLabel: 'Type Testing', requirementText: 'Complete type testing at NMPA-designated laboratories.', fields: [
      { id: 'test_lab', label: 'Designated testing laboratory', type: 'text', required: true, helpText: 'Name of the NMPA-designated test laboratory.' },
      { id: 'test_status', label: 'Testing status', type: 'select', options: ['Completed', 'In progress', 'Not started'], required: true, helpText: 'Status of type testing.' },
      { id: 'test_report', label: 'Type test report', type: 'doc_reference', required: true, helpText: 'Link to the type test report from the designated lab.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — Post-Market Surveillance & Adverse Event Reporting', evidenceRequired: true, steps: [
    { id: '9_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish adverse event monitoring and reporting per NMPA requirements.', fields: [
      { id: 'pms_procedure', label: 'PMS and reporting procedure', type: 'richtext', required: true, helpText: 'Describe the adverse event monitoring and reporting system for the Chinese market.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the post-market surveillance plan.' },
    ]},
  ]},
  '10': { clauseTitle: '10 — Registration Certificate Renewal', evidenceRequired: true, steps: [
    { id: '10_renewal', stepLabel: 'Renewal Planning', requirementText: 'Plan for 5-year registration certificate renewal and change notifications.', fields: [
      { id: 'renewal_date', label: 'Certificate expiry date', type: 'text', helpText: 'Enter the registration certificate expiry date.' },
      { id: 'renewal_plan', label: 'Renewal planning notes', type: 'richtext', helpText: 'Describe the plan for timely renewal and any change notification procedures.' },
      { id: 'renewal_doc', label: 'Renewal documentation', type: 'doc_reference', helpText: 'Link to renewal planning or change notification records.' },
    ]},
  ]},
};
