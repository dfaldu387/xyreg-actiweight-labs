/**
 * KFDA / MFDS (South Korea) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const KFDA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': { clauseTitle: '1 — Device Classification', evidenceRequired: true, steps: [
    { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify per MFDS rules (Class 1–4).', fields: [
      { id: 'device_class', label: 'MFDS device class', type: 'select', options: ['Class 1', 'Class 2', 'Class 3', 'Class 4'], required: true, helpText: 'Select the Korean device classification.' },
      { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain the classification rules applied.' },
      { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to classification determination.' },
    ]},
  ]},
  '2': { clauseTitle: '2 — Licensing / Approval Pathway', evidenceRequired: true, steps: [
    { id: '2_pathway', stepLabel: 'Approval Pathway', requirementText: 'Determine pathway: notification (Class 1), certification (Class 2), or approval (Class 3–4).', fields: [
      { id: 'pathway', label: 'Regulatory pathway', type: 'select', options: ['Notification (Class 1)', 'Certification (Class 2)', 'Approval (Class 3–4)'], required: true, helpText: 'Select the applicable MFDS regulatory pathway.' },
      { id: 'approval_number', label: 'Licence/approval number', type: 'text', helpText: 'Enter once issued.' },
      { id: 'pathway_doc', label: 'Submission dossier', type: 'doc_reference', required: true, helpText: 'Link to the regulatory submission package.' },
    ]},
  ]},
  '3': { clauseTitle: '3 — Korean Authorized Representative', evidenceRequired: true, steps: [
    { id: '3_klh', stepLabel: 'KLH Appointment', requirementText: 'Appoint a Korean License Holder (KLH) or authorized representative.', fields: [
      { id: 'klh_name', label: 'KLH / representative name', type: 'text', required: true, helpText: 'Name of the Korean License Holder or authorized representative.' },
      { id: 'klh_agreement', label: 'KLH agreement', type: 'doc_reference', required: true, helpText: 'Link to the KLH appointment agreement.' },
    ]},
  ]},
  '4': { clauseTitle: '4 — Technical Documentation (KGMP)', evidenceRequired: true, steps: [
    { id: '4_tech', stepLabel: 'Technical Documentation', requirementText: 'Prepare technical documentation per KGMP requirements.', fields: [
      { id: 'tech_summary', label: 'Technical documentation summary', type: 'richtext', required: true, helpText: 'Summarize the technical documentation prepared per KGMP.' },
      { id: 'tech_doc', label: 'Technical documentation', type: 'doc_reference', required: true, helpText: 'Link to the technical documentation.' },
    ]},
  ]},
  '5': { clauseTitle: '5 — GMP Compliance (KGMP)', evidenceRequired: true, steps: [
    { id: '5_gmp', stepLabel: 'KGMP Audit', requirementText: 'Demonstrate GMP compliance per KGMP. Obtain audit results from MFDS.', fields: [
      { id: 'gmp_status', label: 'KGMP audit status', type: 'select', options: ['Passed', 'Scheduled', 'Not started'], required: true, helpText: 'Status of the KGMP compliance audit.' },
      { id: 'gmp_report', label: 'KGMP audit report', type: 'doc_reference', required: true, helpText: 'Link to the KGMP audit report.' },
    ]},
  ]},
  '6': { clauseTitle: '6 — Product Testing at MFDS-Recognized Labs', evidenceRequired: true, steps: [
    { id: '6_testing', stepLabel: 'Product Testing', requirementText: 'Complete testing at MFDS-recognized laboratories.', fields: [
      { id: 'test_lab', label: 'Testing laboratory', type: 'text', required: true, helpText: 'Name of the MFDS-recognized testing laboratory.' },
      { id: 'test_status', label: 'Testing status', type: 'select', options: ['Completed', 'In progress', 'Not started'], required: true, helpText: 'Status of product testing.' },
      { id: 'test_report', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the product test report.' },
    ]},
  ]},
  '7': { clauseTitle: '7 — Clinical Evaluation / Clinical Trial', evidenceRequired: true, steps: [
    { id: '7_clinical', stepLabel: 'Clinical Data', requirementText: 'Provide clinical data or conduct clinical trials for Class 3–4 and novel devices.', fields: [
      { id: 'clinical_approach', label: 'Clinical evidence approach', type: 'richtext', required: true, helpText: 'Describe the clinical data strategy for MFDS requirements.' },
      { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to clinical evaluation or trial data.' },
    ]},
  ]},
  '8': { clauseTitle: '8 — Korean Labelling Requirements', evidenceRequired: true, steps: [
    { id: '8_label', stepLabel: 'Labelling', requirementText: 'Ensure labelling in Korean language meeting MFDS requirements.', fields: [
      { id: 'label_compliance', label: 'Korean labelling compliance', type: 'richtext', required: true, helpText: 'Confirm Korean-language labelling includes: manufacturer, intended use, warnings.' },
      { id: 'label_specimen', label: 'Korean label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved Korean-language label artwork.' },
    ]},
  ]},
  '9': { clauseTitle: '9 — Post-Market Surveillance & Adverse Event Reporting', evidenceRequired: true, steps: [
    { id: '9_pms', stepLabel: 'PMS & Vigilance', requirementText: 'Establish adverse event reporting and PMS per MFDS requirements.', fields: [
      { id: 'pms_procedure', label: 'PMS and reporting procedure', type: 'richtext', required: true, helpText: 'Describe the PMS and adverse event reporting system for South Korea.' },
      { id: 'pms_doc', label: 'PMS plan / vigilance SOP', type: 'doc_reference', required: true, helpText: 'Link to the PMS plan for the Korean market.' },
    ]},
  ]},
};
