/**
 * PMDA (Japan) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const PMDA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify under Japanese PMD Act classes (I–IV) and determine approval pathway.', fields: [
      { id: 'device_class', label: 'PMDA device class', type: 'select', options: ['Class I', 'Class II', 'Class III', 'Class IV'], required: true, helpText: 'Select the Japanese device classification.' },
      { id: 'approval_pathway', label: 'Approval pathway', type: 'select', options: ['Todokede (Notification)', 'Ninsho (Certification)', 'Shonin (Approval)'], required: true, helpText: 'Select the applicable regulatory pathway.' },
      { id: 'classification_doc', label: 'Classification rationale', type: 'doc_reference', helpText: 'Link to classification determination document.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — Marketing Authorization Holder (MAH)', evidenceRequired: true, steps: [
    { id: '2_mah', stepLabel: 'MAH Designation', requirementText: 'Designate a Marketing Authorization Holder in Japan or appoint D-MAH.', fields: [
      { id: 'mah_name', label: 'MAH / D-MAH name', type: 'text', required: true, helpText: 'Name of the designated Marketing Authorization Holder.' },
      { id: 'mah_licence', label: 'MAH licence number', type: 'text', helpText: 'MAH business licence number.' },
      { id: 'mah_agreement', label: 'MAH agreement', type: 'doc_reference', helpText: 'Link to the MAH agreement or contract.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — Pre-market Approval/Certification/Notification', evidenceRequired: true, steps: [
    { id: '3_submission', stepLabel: 'Submission', requirementText: 'Submit Shonin, Ninsho, or Todokede application as appropriate.', fields: [
      { id: 'submission_status', label: 'Submission status', type: 'select', options: ['Submitted', 'Approved', 'In preparation', 'Not required'], required: true, helpText: 'Current status of the regulatory submission.' },
      { id: 'approval_number', label: 'Approval/certification number', type: 'text', helpText: 'Enter once issued.' },
      { id: 'submission_doc', label: 'Submission dossier', type: 'doc_reference', required: true, helpText: 'Link to the regulatory submission package.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — QMS Compliance (MHLW Ordinance 169)', evidenceRequired: true, steps: [
    { id: '4_qms', stepLabel: 'QMS Audit', requirementText: 'Demonstrate QMS compliance per MHLW Ministerial Ordinance No. 169.', fields: [
      { id: 'qms_audit_status', label: 'QMS audit status', type: 'select', options: ['Passed', 'Scheduled', 'Not started'], required: true, helpText: 'Status of the QMS compliance audit.' },
      { id: 'qms_audit_body', label: 'Audit body (RCB)', type: 'text', helpText: 'Name of the Registered Certification Body.' },
      { id: 'qms_audit_report', label: 'QMS audit report', type: 'doc_reference', required: true, helpText: 'Link to the QMS audit report.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — Essential Principles / Technical Standards', evidenceRequired: true, steps: [
    { id: '5_standards', stepLabel: 'Standards Compliance', requirementText: 'Demonstrate conformity with Japanese essential principles or applicable JIS standards.', fields: [
      { id: 'standards_list', label: 'Applicable JIS/essential standards', type: 'richtext', required: true, helpText: 'List all applicable Japanese standards and essential principles with compliance status.' },
      { id: 'standards_doc', label: 'Standards compliance evidence', type: 'doc_reference', required: true, helpText: 'Link to test reports and compliance documentation.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Clinical Evaluation / Clinical Trial Data', evidenceRequired: true, steps: [
    { id: '6_clinical', stepLabel: 'Clinical Data', requirementText: 'Provide clinical evaluation or Chiken data to support safety and efficacy.', fields: [
      { id: 'clinical_approach', label: 'Clinical evidence approach', type: 'richtext', required: true, helpText: 'Describe use of clinical trials (Chiken), literature, foreign clinical data, or equivalence.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to the clinical evaluation report or Chiken data.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Japanese Labelling Requirements', evidenceRequired: true, steps: [
    { id: '7_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling in Japanese meeting PMD Act requirements.', fields: [
      { id: 'label_compliance', label: 'Japanese labelling compliance', type: 'richtext', required: true, helpText: 'Confirm Japanese-language labelling includes: manufacturer, intended purpose, warnings, lot/serial.' },
      { id: 'label_specimen', label: 'Japanese label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved Japanese-language label artwork.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — Post-Market Surveillance & Adverse Event Reporting', evidenceRequired: true, steps: [
    { id: '8_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish post-market surveillance and adverse event reporting to PMDA.', fields: [
      { id: 'pms_procedure', label: 'PMS and reporting procedure', type: 'richtext', required: true, helpText: 'Describe adverse event reporting timelines and periodic safety update procedures.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the post-market surveillance plan for Japan.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — Foreign Manufacturer Registration (FMR)', evidenceRequired: true, steps: [
    { id: '9_fmr', stepLabel: 'FMR Registration', requirementText: 'Register as a Foreign Manufacturer with PMDA if manufacturing outside Japan.', fields: [
      { id: 'fmr_status', label: 'FMR registration status', type: 'select', options: ['Registered', 'In progress', 'Not required'], required: true, helpText: 'Status of Foreign Manufacturer Registration with PMDA.' },
      { id: 'fmr_number', label: 'FMR accreditation number', type: 'text', helpText: 'Enter the FMR accreditation number.' },
      { id: 'fmr_doc', label: 'FMR certificate', type: 'doc_reference', helpText: 'Link to the FMR registration certificate.' },
    ]},
  ]},
};
