/**
 * ANVISA (Brazil) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ANVISA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per ANVISA risk classes (I–IV) based on RDC 751/2022.', fields: [
      { id: 'device_class', label: 'ANVISA device class', type: 'select', options: ['Class I', 'Class II', 'Class III', 'Class IV'], required: true, helpText: 'Select the ANVISA risk classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain classification rules applied per RDC 751/2022.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification rationale document.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — ANVISA Registration / Notification', evidenceRequired: true, steps: [
    { id: '2_reg', stepLabel: 'Registration', requirementText: 'Submit registration (Class III/IV) or notification (Class I/II) to ANVISA.', fields: [
      { id: 'reg_pathway', label: 'Submission pathway', type: 'select', options: ['Notification (Class I/II)', 'Registration (Class III/IV)'], required: true, helpText: 'Select the applicable submission pathway.' },
      { id: 'reg_number', label: 'ANVISA registration number', type: 'text', helpText: 'Enter once issued.' },
      { id: 'reg_doc', label: 'Registration dossier', type: 'doc_reference', required: true, helpText: 'Link to the submission package.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — Brazilian Registration Holder (BRH)', evidenceRequired: true, steps: [
    { id: '3_brh', stepLabel: 'BRH Designation', requirementText: 'Designate a Brazilian Registration Holder with ANVISA.', fields: [
      { id: 'brh_name', label: 'BRH name', type: 'text', required: true, helpText: 'Name of the Brazilian Registration Holder.' },
      { id: 'brh_agreement', label: 'BRH agreement', type: 'doc_reference', required: true, helpText: 'Link to the BRH designation agreement.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — GMP Compliance (RDC 16)', evidenceRequired: true, steps: [
    { id: '4_gmp', stepLabel: 'GMP / MDSAP', requirementText: 'Demonstrate GMP compliance per ANVISA RDC 16 or ISO 13485.', fields: [
      { id: 'gmp_approach', label: 'GMP compliance approach', type: 'select', options: ['MDSAP audit', 'ANVISA GMP inspection', 'ISO 13485 certificate'], required: true, helpText: 'Select the approach used to demonstrate GMP compliance.' },
      { id: 'gmp_doc', label: 'GMP certificate / audit report', type: 'doc_reference', required: true, helpText: 'Link to the GMP certificate or MDSAP audit report.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — Essential Safety and Performance Requirements', evidenceRequired: true, steps: [
    { id: '5_espr', stepLabel: 'Safety & Performance', requirementText: 'Demonstrate compliance with ANVISA essential safety and performance requirements.', fields: [
      { id: 'espr_checklist', label: 'Essential requirements compliance', type: 'richtext', required: true, helpText: 'Document compliance with each applicable essential requirement based on IMDRF principles.' },
      { id: 'espr_doc', label: 'Essential requirements document', type: 'doc_reference', required: true, helpText: 'Link to the essential requirements checklist.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Clinical Evidence', evidenceRequired: true, steps: [
    { id: '6_clinical', stepLabel: 'Clinical Data', requirementText: 'Provide clinical data per ANVISA clinical evidence requirements.', fields: [
      { id: 'clinical_strategy', label: 'Clinical evidence strategy', type: 'richtext', required: true, helpText: 'Describe the clinical evidence approach.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to clinical evaluation report or study data.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Portuguese Labelling Requirements', evidenceRequired: true, steps: [
    { id: '7_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling in Brazilian Portuguese.', fields: [
      { id: 'label_compliance', label: 'Portuguese labelling compliance', type: 'richtext', required: true, helpText: 'Confirm Portuguese labelling includes: manufacturer, intended use, lot/serial, expiry, warnings.' },
      { id: 'label_specimen', label: 'Portuguese label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved Portuguese-language label artwork.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — INMETRO Certification', evidenceRequired: true, steps: [
    { id: '8_inmetro', stepLabel: 'INMETRO', requirementText: 'Obtain INMETRO certification where applicable.', fields: [
      { id: 'inmetro_applicable', label: 'INMETRO certification required?', type: 'select', options: ['Yes', 'No — not applicable'], required: true, helpText: 'Indicate whether INMETRO certification is required for this device category.' },
      { id: 'inmetro_cert', label: 'INMETRO certificate', type: 'doc_reference', helpText: 'Link to INMETRO certification if applicable.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — Post-Market Surveillance (Tecnovigilância)', evidenceRequired: true, steps: [
    { id: '9_pms', stepLabel: 'Tecnovigilância', requirementText: 'Establish tecnovigilância system for adverse event reporting per ANVISA.', fields: [
      { id: 'pms_procedure', label: 'Tecnovigilância procedure', type: 'richtext', required: true, helpText: 'Describe the adverse event reporting and post-market monitoring system for Brazil.' },
      { id: 'pms_doc', label: 'PMS plan / Tecnovigilância SOP', type: 'doc_reference', required: true, helpText: 'Link to the tecnovigilância plan.' },
    ]},
  ]},
};
