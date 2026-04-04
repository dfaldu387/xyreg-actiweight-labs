/**
 * ISO 20417 Information Supplied by the Manufacturer — Clause-Specific Form Field Definitions
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_20417_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '4.1': {
    clauseTitle: '4.1 — General Requirements for Information Supplied',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_general',
        stepLabel: 'Information Accuracy & Accessibility',
        requirementText: 'Ensure all information supplied by the manufacturer is accurate, accessible, and meets ISO 20417 requirements.',
        fields: [
          { id: 'info_review_process', label: 'Information review process', type: 'richtext', helpText: 'Describe the process for reviewing and approving all manufacturer-supplied information (labels, IFU, marketing materials) for accuracy and completeness.' },
          { id: 'info_policy_ref', label: 'Information management procedure', type: 'doc_reference', helpText: 'Link to the SOP/procedure for managing manufacturer-supplied information.' },
        ],
      },
    ],
  },
  '4.2': {
    clauseTitle: '4.2 — Language Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_language',
        stepLabel: 'Language Compliance',
        requirementText: 'Provide information in the official language(s) of the country where the device is placed on the market.',
        fields: [
          { id: 'target_languages', label: 'Target languages and markets', type: 'richtext', helpText: 'List all target markets and the official language(s) required for each. Include any regulatory-specific language requirements.' },
          { id: 'translation_process', label: 'Translation and verification process', type: 'richtext', helpText: 'Describe the translation process, including use of qualified translators and back-translation verification.' },
          { id: 'translation_evidence_ref', label: 'Translation records', type: 'doc_reference', helpText: 'Link to translation records or certificates.' },
        ],
      },
    ],
  },
  '5.1': {
    clauseTitle: '5.1 — Label Content: Manufacturer Identification',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_mfr_id',
        stepLabel: 'Manufacturer Identification on Label',
        requirementText: 'Include manufacturer name, address, device name, model, and UDI on the device label.',
        fields: [
          { id: 'label_content', label: 'Label content checklist', type: 'richtext', helpText: 'Confirm the label includes: manufacturer name and address, device trade name, model/catalogue number, UDI carrier (barcode + HRI), and any authorized representative details.' },
          { id: 'label_specimen_ref', label: 'Label specimen / artwork', type: 'doc_reference', required: true, helpText: 'Link to the approved label artwork or specimen.' },
        ],
      },
    ],
  },
  '5.2': {
    clauseTitle: '5.2 — Label Content: Safety and Performance',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_safety',
        stepLabel: 'Safety & Performance Information',
        requirementText: 'Include warnings, precautions, contraindications, expiry date, lot/serial, storage conditions on the label.',
        fields: [
          { id: 'safety_info', label: 'Safety information on label', type: 'richtext', helpText: 'List all safety-related information on the label: warnings, precautions, contraindications, expiry date, lot/batch number, serial number, storage/handling conditions.' },
          { id: 'label_review_ref', label: 'Label review checklist', type: 'doc_reference', helpText: 'Link to the completed label review checklist or verification record.' },
        ],
      },
    ],
  },
  '5.3': {
    clauseTitle: '5.3 — Label Content: Sterile and Single-Use Devices',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_sterile',
        stepLabel: 'Sterile / Single-Use Markings',
        requirementText: 'Provide sterilisation method, sterile barrier system information, and single-use/do-not-reuse markings.',
        fields: [
          { id: 'sterile_markings', label: 'Sterility and single-use markings', type: 'richtext', helpText: 'Confirm the label includes: sterilisation method symbol, sterile barrier system integrity indicators, single-use symbol, do-not-reuse statement (if applicable). State N/A if device is non-sterile and reusable.' },
          { id: 'sterile_label_ref', label: 'Sterile label specimen', type: 'doc_reference', helpText: 'Link to label artwork showing sterility markings.' },
        ],
      },
    ],
  },
  '6.1': {
    clauseTitle: '6.1 — IFU: General Content',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_ifu_content',
        stepLabel: 'IFU Content Review',
        requirementText: 'Include intended purpose, intended users, indications, contraindications, warnings, precautions in the IFU.',
        fields: [
          { id: 'ifu_checklist', label: 'IFU content completeness', type: 'richtext', helpText: 'Confirm the IFU includes: intended purpose, intended user profile, patient population, indications for use, contraindications, warnings, precautions, and residual risks.' },
          { id: 'ifu_doc_ref', label: 'Instructions for use document', type: 'doc_reference', required: true, helpText: 'Link to the current approved IFU document.' },
        ],
      },
    ],
  },
  '6.2': {
    clauseTitle: '6.2 — IFU: Installation and Setup',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_install',
        stepLabel: 'Installation Instructions',
        requirementText: 'Provide installation, assembly, calibration, and initial setup instructions where applicable.',
        fields: [
          { id: 'install_content', label: 'Installation/setup content', type: 'richtext', helpText: 'Describe installation, assembly, calibration, and initial setup instructions provided. If not applicable, provide justification.' },
          { id: 'install_ifu_ref', label: 'Installation section of IFU', type: 'doc_reference', helpText: 'Link to the IFU section covering installation.' },
        ],
      },
    ],
  },
  '6.3': {
    clauseTitle: '6.3 — IFU: Operation and Maintenance',
    evidenceRequired: true,
    steps: [
      {
        id: '6.3_operation',
        stepLabel: 'Operation & Maintenance',
        requirementText: 'Provide operating instructions, maintenance procedures, cleaning/disinfection, and troubleshooting guidance.',
        fields: [
          { id: 'operation_content', label: 'Operation and maintenance content', type: 'richtext', helpText: 'Describe operating instructions, maintenance schedule, cleaning/disinfection procedures, and troubleshooting guidance provided in the IFU.' },
          { id: 'maintenance_schedule_ref', label: 'Maintenance schedule / checklist', type: 'doc_reference', helpText: 'Link to the maintenance schedule or preventive maintenance checklist.' },
        ],
      },
    ],
  },
  '6.4': {
    clauseTitle: '6.4 — IFU: Disposal and End of Life',
    evidenceRequired: true,
    steps: [
      {
        id: '6.4_disposal',
        stepLabel: 'Disposal Instructions',
        requirementText: 'Provide disposal instructions, environmental considerations, and end-of-life procedures.',
        fields: [
          { id: 'disposal_content', label: 'Disposal and end-of-life content', type: 'richtext', helpText: 'Describe disposal instructions including decontamination before disposal, hazardous material handling, WEEE compliance (if applicable), and recyclability information.' },
        ],
      },
    ],
  },
  '7.1': {
    clauseTitle: '7.1 — Electronic Instructions for Use (eIFU)',
    evidenceRequired: true,
    steps: [
      {
        id: '7.1_eifu',
        stepLabel: 'eIFU Compliance',
        requirementText: 'If providing eIFU, demonstrate compliance with applicable regulatory requirements for electronic delivery.',
        fields: [
          { id: 'eifu_approach', label: 'eIFU delivery approach', type: 'richtext', helpText: 'Describe the eIFU delivery mechanism (website, QR code, app). Reference applicable regulations (e.g., EU Regulation 207/2012 for MDR, FDA guidance for US).' },
          { id: 'eifu_justification', label: 'eIFU eligibility justification', type: 'richtext', helpText: 'Justify eligibility for eIFU. Note: not all device classes are eligible. Paper IFU must be available on request.' },
          { id: 'eifu_reg_ref', label: 'Regulatory compliance evidence', type: 'doc_reference', helpText: 'Link to eIFU regulatory compliance assessment.' },
        ],
      },
    ],
  },
  '7.2': {
    clauseTitle: '7.2 — eIFU Availability and Accessibility',
    evidenceRequired: true,
    steps: [
      {
        id: '7.2_availability',
        stepLabel: 'eIFU Availability',
        requirementText: 'Ensure eIFU is available throughout the device lifetime and accessible to users in appropriate formats.',
        fields: [
          { id: 'availability_plan', label: 'eIFU availability plan', type: 'richtext', helpText: 'Describe how the eIFU will remain available for the expected device lifetime (including after end of production). Include backup/archiving strategy.' },
          { id: 'accessibility', label: 'Accessibility measures', type: 'richtext', helpText: 'Describe accessibility features: supported formats (PDF, HTML), supported devices/browsers, offline access capability, accessibility for users with disabilities.' },
        ],
      },
    ],
  },
};
