/**
 * MepV / Swissmedic (Switzerland) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const MEPSW_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per Swiss MepV rules aligned with EU MDR classes.', fields: [
      { id: 'device_class', label: 'Swiss device class', type: 'select', options: ['Class I', 'Class IIa', 'Class IIb', 'Class III'], required: true, helpText: 'Select the Swiss/MepV classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain classification rules applied.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification determination.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — Swiss Authorized Representative (CH-REP)', evidenceRequired: true, steps: [
    { id: '2_chrep', stepLabel: 'CH-REP Appointment', requirementText: 'Appoint a Swiss Authorized Representative for foreign manufacturers.', fields: [
      { id: 'chrep_name', label: 'CH-REP name', type: 'text', required: true, helpText: 'Name of the appointed Swiss Authorized Representative.' },
      { id: 'chrep_agreement', label: 'CH-REP agreement', type: 'doc_reference', required: true, helpText: 'Link to the CH-REP appointment agreement.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — Swissmedic Registration', evidenceRequired: true, steps: [
    { id: '3_reg', stepLabel: 'Registration', requirementText: 'Register device and economic operators with Swissmedic.', fields: [
      { id: 'reg_status', label: 'Swissmedic registration status', type: 'select', options: ['Registered', 'In progress', 'Not started'], required: true, helpText: 'Current Swissmedic registration status.' },
      { id: 'reg_doc', label: 'Registration confirmation', type: 'doc_reference', helpText: 'Link to Swissmedic registration confirmation.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — Conformity Assessment (MepV)', evidenceRequired: true, steps: [
    { id: '4_ca', stepLabel: 'Conformity Assessment', requirementText: 'Complete conformity assessment using EU NB or Swiss Designated Body.', fields: [
      { id: 'ca_body', label: 'Assessment body', type: 'text', required: true, helpText: 'Name of the EU Notified Body or Swiss Designated Body.' },
      { id: 'ca_certificate', label: 'Conformity certificate', type: 'doc_reference', required: true, helpText: 'Link to the conformity assessment certificate.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — Essential Requirements Compliance', evidenceRequired: true, steps: [
    { id: '5_er', stepLabel: 'GSPR Compliance', requirementText: 'Demonstrate compliance with GSPR aligned with EU MDR Annex I.', fields: [
      { id: 'gspr_checklist', label: 'GSPR compliance summary', type: 'richtext', required: true, helpText: 'Document compliance with general safety and performance requirements.' },
      { id: 'gspr_doc', label: 'GSPR checklist', type: 'doc_reference', required: true, helpText: 'Link to the GSPR compliance checklist.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Technical Documentation', evidenceRequired: true, steps: [
    { id: '6_tech', stepLabel: 'Technical File', requirementText: 'Maintain technical documentation per MepV requirements.', fields: [
      { id: 'tech_summary', label: 'Technical documentation summary', type: 'richtext', helpText: 'Summarize the technical file.' },
      { id: 'tech_doc', label: 'Technical documentation', type: 'doc_reference', required: true, helpText: 'Link to the technical file.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Labelling — Swiss Requirements', evidenceRequired: true, steps: [
    { id: '7_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling meets Swiss requirements (DE/FR/IT).', fields: [
      { id: 'label_languages', label: 'Language compliance', type: 'select', options: ['DE/FR/IT — all three', 'Subset with justification', 'In progress'], required: true, helpText: 'Confirm multilingual labelling compliance.' },
      { id: 'label_compliance', label: 'Label content compliance', type: 'richtext', helpText: 'Confirm inclusion of CH-REP details, conformity marks, required information.' },
      { id: 'label_specimen', label: 'Swiss label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved Swiss label artwork.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — Post-Market Surveillance and Vigilance', evidenceRequired: true, steps: [
    { id: '8_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish PMS and vigilance reporting to Swissmedic.', fields: [
      { id: 'pms_procedure', label: 'PMS and vigilance procedure', type: 'richtext', required: true, helpText: 'Describe the PMS and adverse event reporting system for Switzerland.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the PMS plan for the Swiss market.' },
    ]},
  ]},
};
