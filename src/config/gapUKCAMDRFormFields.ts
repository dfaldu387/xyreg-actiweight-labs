/**
 * UKCA MDR (United Kingdom) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const UKCA_MDR_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per UK MDR 2002 (Class I, IIa, IIb, III).', fields: [
      { id: 'device_class', label: 'UK device class', type: 'select', options: ['Class I', 'Class IIa', 'Class IIb', 'Class III'], required: true, helpText: 'Select the UK MDR 2002 classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain the classification rules applied.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification determination.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — UKCA / UKNI Marking', evidenceRequired: true, steps: [
    { id: '2_marking', stepLabel: 'Marking Determination', requirementText: 'Determine whether UKCA, UKNI, or CE marking is required.', fields: [
      { id: 'marking_type', label: 'Applicable marking', type: 'select', options: ['UKCA', 'UKNI', 'CE (NI only)', 'UKCA + CE'], required: true, helpText: 'Select the required conformity marking based on target market (GB, NI, or both).' },
      { id: 'marking_rationale', label: 'Marking determination rationale', type: 'richtext', helpText: 'Explain why this marking applies.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — UK Responsible Person', evidenceRequired: true, steps: [
    { id: '3_ukrp', stepLabel: 'UKRP Appointment', requirementText: 'Appoint a UK Responsible Person (UKRP) for the GB market.', fields: [
      { id: 'ukrp_name', label: 'UKRP name', type: 'text', required: true, helpText: 'Name of the appointed UK Responsible Person.' },
      { id: 'ukrp_agreement', label: 'UKRP agreement', type: 'doc_reference', required: true, helpText: 'Link to the UKRP appointment agreement.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — MHRA Device Registration', evidenceRequired: true, steps: [
    { id: '4_mhra', stepLabel: 'MHRA Registration', requirementText: 'Register the device with MHRA before GB market placement.', fields: [
      { id: 'mhra_status', label: 'MHRA registration status', type: 'select', options: ['Registered', 'In progress', 'Not started'], required: true, helpText: 'Current MHRA registration status.' },
      { id: 'mhra_doc', label: 'MHRA registration confirmation', type: 'doc_reference', helpText: 'Link to MHRA registration confirmation.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — UK Approved Body Assessment', evidenceRequired: true, steps: [
    { id: '5_ab', stepLabel: 'Approved Body', requirementText: 'Obtain conformity assessment from a UK Approved Body for Class IIa, IIb, and III.', fields: [
      { id: 'ab_name', label: 'UK Approved Body name', type: 'text', required: true, helpText: 'Name of the UK Approved Body.' },
      { id: 'ab_certificate', label: 'Approved Body certificate', type: 'doc_reference', required: true, helpText: 'Link to the conformity assessment certificate.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Essential Requirements (UK MDR 2002)', evidenceRequired: true, steps: [
    { id: '6_er', stepLabel: 'Essential Requirements', requirementText: 'Demonstrate compliance with essential requirements per UK MDR 2002 Schedule 1.', fields: [
      { id: 'er_checklist', label: 'Essential requirements compliance', type: 'richtext', required: true, helpText: 'Document compliance with each applicable essential requirement.' },
      { id: 'er_doc', label: 'Essential requirements checklist', type: 'doc_reference', required: true, helpText: 'Link to the essential requirements checklist.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Technical Documentation', evidenceRequired: true, steps: [
    { id: '7_tech', stepLabel: 'Technical File', requirementText: 'Maintain technical documentation for MHRA review.', fields: [
      { id: 'tech_summary', label: 'Technical documentation summary', type: 'richtext', helpText: 'Summarize the technical file structure.' },
      { id: 'tech_doc', label: 'Technical documentation', type: 'doc_reference', required: true, helpText: 'Link to the technical file.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — UK Labelling Requirements', evidenceRequired: true, steps: [
    { id: '8_label', stepLabel: 'Labelling', requirementText: 'Ensure English labelling meets UK MDR 2002 requirements.', fields: [
      { id: 'label_compliance', label: 'UK labelling compliance', type: 'richtext', required: true, helpText: 'Confirm labelling includes UKCA mark, UKRP details, UDI, and required information.' },
      { id: 'label_specimen', label: 'UK label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved UK label artwork.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — Post-Market Surveillance & Adverse Event Reporting', evidenceRequired: true, steps: [
    { id: '9_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish vigilance and PMS systems meeting MHRA requirements.', fields: [
      { id: 'pms_procedure', label: 'PMS and vigilance procedure', type: 'richtext', required: true, helpText: 'Describe the PMS and adverse event reporting system for the UK.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the PMS plan for the UK market.' },
    ]},
  ]},
  '10': { clauseTitle: '10 — Clinical Evidence', evidenceRequired: true, steps: [
    { id: '10_clinical', stepLabel: 'Clinical Data', requirementText: 'Provide clinical evidence per UK clinical evidence requirements.', fields: [
      { id: 'clinical_strategy', label: 'Clinical evidence strategy', type: 'richtext', required: true, helpText: 'Describe the clinical evidence approach for UK market.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to clinical evaluation report.' },
    ]},
  ]},
};
