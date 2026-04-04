/**
 * CMDR (Canada) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for Canadian medical device regulations.
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const CMDR_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': {
    clauseTitle: '1 — Device Classification',
    evidenceRequired: true,
    steps: [
      {
        id: '1_class',
        stepLabel: 'Classification Determination',
        requirementText: 'Classify the medical device per CMDR Schedule 1 (Class I–IV) based on risk level and intended use.',
        fields: [
          { id: 'device_class', label: 'Canadian device class (I–IV)', type: 'select', options: ['Class I', 'Class II', 'Class III', 'Class IV'], required: true, helpText: 'Select the Health Canada classification per CMDR Schedule 1 rules.' },
          { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain the rule(s) applied and how the device features map to the selected class.' },
          { id: 'classification_doc', label: 'Classification determination document', type: 'doc_reference', helpText: 'Link to formal classification rationale document.' },
        ],
      },
    ],
  },
  '2': {
    clauseTitle: '2 — Medical Device Licence Application',
    evidenceRequired: true,
    steps: [
      {
        id: '2_licence',
        stepLabel: 'Licence Application',
        requirementText: 'Prepare and submit a medical device licence (MDL) application to Health Canada for Class II, III, or IV devices.',
        fields: [
          { id: 'licence_pathway', label: 'Licence pathway', type: 'select', options: ['Class II Declaration', 'Class III Application', 'Class IV Application'], required: true, helpText: 'Select the applicable licence submission pathway.' },
          { id: 'licence_number', label: 'MDL number (if issued)', type: 'text', helpText: 'Enter the medical device licence number once issued by Health Canada.' },
          { id: 'submission_doc', label: 'Licence application dossier', type: 'doc_reference', required: true, helpText: 'Link to the completed licence application package.' },
        ],
      },
    ],
  },
  '3': {
    clauseTitle: '3 — Establishment Licence',
    evidenceRequired: true,
    steps: [
      {
        id: '3_mdel',
        stepLabel: 'MDEL Requirements',
        requirementText: 'Obtain a Medical Device Establishment Licence (MDEL) for importing or distributing medical devices in Canada.',
        fields: [
          { id: 'mdel_holder', label: 'MDEL holder name and licence number', type: 'text', required: true, helpText: 'Provide the name and MDEL number of the establishment licence holder.' },
          { id: 'mdel_activities', label: 'Licensed activities', type: 'richtext', helpText: 'Describe the activities covered (import, distribute, wholesale).' },
          { id: 'mdel_doc', label: 'MDEL certificate', type: 'doc_reference', helpText: 'Link to the establishment licence certificate.' },
        ],
      },
    ],
  },
  '4': {
    clauseTitle: '4 — Safety and Effectiveness Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '4_safety',
        stepLabel: 'Safety & Effectiveness Evidence',
        requirementText: 'Demonstrate device safety and effectiveness per CMDR sections 10–20.',
        fields: [
          { id: 'safety_summary', label: 'Safety and effectiveness summary', type: 'richtext', required: true, helpText: 'Summarize how the device meets CMDR sections 10-20 covering design, materials, performance, and biocompatibility.' },
          { id: 'performance_data', label: 'Performance test reports', type: 'doc_reference', helpText: 'Link to bench testing and performance verification reports.' },
          { id: 'biocompat_data', label: 'Biocompatibility data', type: 'doc_reference', helpText: 'Link to biocompatibility evaluation per applicable standards.' },
        ],
      },
    ],
  },
  '5': {
    clauseTitle: '5 — Quality Management System (ISO 13485)',
    evidenceRequired: true,
    steps: [
      {
        id: '5_qms',
        stepLabel: 'QMS Certification',
        requirementText: 'Maintain an ISO 13485-compliant QMS. Provide QMS certificates for Class III and IV licence applications.',
        fields: [
          { id: 'qms_cert_status', label: 'ISO 13485 certification status', type: 'select', options: ['Certified', 'In progress', 'Not started'], required: true, helpText: 'Indicate the current ISO 13485 certification status.' },
          { id: 'qms_cert_body', label: 'Certification body', type: 'text', helpText: 'Name of the registrar/certification body.' },
          { id: 'qms_cert_doc', label: 'ISO 13485 certificate', type: 'doc_reference', required: true, helpText: 'Link to the ISO 13485 certificate.' },
        ],
      },
    ],
  },
  '6': {
    clauseTitle: '6 — Labelling Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '6_labelling',
        stepLabel: 'Bilingual Labelling',
        requirementText: 'Ensure bilingual labelling (English/French) meeting CMDR sections 21–23.',
        fields: [
          { id: 'label_languages', label: 'Label language compliance', type: 'select', options: ['English & French', 'English only — exemption applies', 'In progress'], required: true, helpText: 'Confirm bilingual labelling compliance or applicable exemption.' },
          { id: 'label_content', label: 'Label content checklist', type: 'richtext', helpText: 'Confirm inclusion of: device name, manufacturer, lot/serial, directions for use, warnings, conditions of storage.' },
          { id: 'label_specimen', label: 'Label specimen / artwork', type: 'doc_reference', required: true, helpText: 'Link to approved label artwork showing bilingual content.' },
        ],
      },
    ],
  },
  '7': {
    clauseTitle: '7 — Mandatory Problem Reporting',
    evidenceRequired: true,
    steps: [
      {
        id: '7_reporting',
        stepLabel: 'Incident Reporting System',
        requirementText: 'Establish a system for mandatory reporting of incidents to Health Canada per CMDR Part 1, Division 3.',
        fields: [
          { id: 'reporting_procedure', label: 'Mandatory problem reporting procedure', type: 'richtext', required: true, helpText: 'Describe the procedure for identifying, investigating, and reporting incidents within required timelines.' },
          { id: 'reporting_sop', label: 'Reporting SOP', type: 'doc_reference', required: true, helpText: 'Link to the SOP for mandatory problem reporting to Health Canada.' },
        ],
      },
    ],
  },
  '8': {
    clauseTitle: '8 — MDSAP Audit Coverage',
    evidenceRequired: true,
    steps: [
      {
        id: '8_mdsap',
        stepLabel: 'MDSAP Compliance',
        requirementText: 'Ensure MDSAP audit coverage for Canadian regulatory requirements.',
        fields: [
          { id: 'mdsap_status', label: 'MDSAP audit status', type: 'select', options: ['Completed', 'Scheduled', 'Not applicable'], required: true, helpText: 'Indicate the status of MDSAP auditing covering Canadian requirements.' },
          { id: 'mdsap_scope', label: 'MDSAP scope — Canada included', type: 'richtext', helpText: 'Confirm that the MDSAP audit scope includes Health Canada regulatory requirements.' },
          { id: 'mdsap_report', label: 'MDSAP audit report', type: 'doc_reference', helpText: 'Link to the most recent MDSAP audit report.' },
        ],
      },
    ],
  },
  '9': {
    clauseTitle: '9 — Clinical Evidence',
    evidenceRequired: true,
    steps: [
      {
        id: '9_clinical',
        stepLabel: 'Clinical Data',
        requirementText: 'Provide clinical evidence supporting safety and effectiveness claims per Health Canada guidance.',
        fields: [
          { id: 'clinical_strategy', label: 'Clinical evidence strategy', type: 'richtext', required: true, helpText: 'Describe whether relying on clinical trials, literature review, predicate equivalence, or combination.' },
          { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to the clinical evidence summary or clinical study report.' },
        ],
      },
    ],
  },
  '10': {
    clauseTitle: '10 — UDI Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '10_udi',
        stepLabel: 'UDI Compliance',
        requirementText: 'Comply with Canadian UDI requirements for device identification and traceability.',
        fields: [
          { id: 'udi_status', label: 'UDI implementation status', type: 'select', options: ['Implemented', 'In progress', 'Planning'], required: true, helpText: 'Indicate the current UDI implementation status for the Canadian market.' },
          { id: 'udi_di', label: 'UDI-DI identifier', type: 'text', helpText: 'Enter the device identifier (DI) portion of the UDI.' },
          { id: 'udi_doc', label: 'UDI assignment documentation', type: 'doc_reference', helpText: 'Link to UDI assignment and database registration records.' },
        ],
      },
    ],
  },
};
