/**
 * ISO 15223-1 Medical Device Symbols — Clause-Specific Form Field Definitions
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_15223_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '4.1': {
    clauseTitle: '4.1 — General Requirements for Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_conformity',
        stepLabel: 'Symbol Conformity',
        requirementText: 'Ensure symbols conform to ISO 15223-1 on medical device labels, packaging, and accompanying information.',
        fields: [
          { id: 'symbol_policy', label: 'Symbol usage policy', type: 'richtext', helpText: 'Describe the company policy/procedure for selecting and applying standardised symbols on device labelling.' },
          { id: 'symbol_reference_doc', label: 'Symbol reference document', type: 'doc_reference', helpText: 'Link to the symbol reference document or labelling specification.' },
        ],
      },
    ],
  },
  '4.2': {
    clauseTitle: '4.2 — Symbol Selection and Application',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_selection',
        stepLabel: 'Selection Process',
        requirementText: 'Select appropriate standardised symbols for conveying safety and regulatory information.',
        fields: [
          { id: 'selection_rationale', label: 'Symbol selection rationale', type: 'richtext', helpText: 'Explain how symbols were selected for this device based on regulatory requirements and device characteristics.' },
          { id: 'symbol_inventory', label: 'Symbol inventory for this device', type: 'richtext', helpText: 'List all symbols used on the device label and packaging with their ISO 15223-1 reference numbers and meanings.' },
        ],
      },
    ],
  },
  '5.1': {
    clauseTitle: '5.1 — Manufacturer and Device Identification Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_id_symbols',
        stepLabel: 'Identification Symbols',
        requirementText: 'Apply manufacturer name/address, catalogue/model number, batch code, serial number, and date of manufacture symbols.',
        fields: [
          { id: 'id_symbols_used', label: 'Identification symbols applied', type: 'richtext', helpText: 'List which identification symbols are used: manufacturer (5.1.1), date of manufacture (5.1.3), use-by date (5.1.4), batch code (5.1.5), serial number (5.1.6), catalogue number (5.1.7).' },
          { id: 'label_artwork_ref', label: 'Label artwork / specimen', type: 'doc_reference', required: true, helpText: 'Link to the approved label artwork showing the identification symbols.' },
        ],
      },
    ],
  },
  '5.2': {
    clauseTitle: '5.2 — Handling and Storage Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_handling',
        stepLabel: 'Handling & Storage Symbols',
        requirementText: 'Apply symbols for storage conditions, fragile, keep dry, temperature limits, humidity limits, and stacking limits.',
        fields: [
          { id: 'handling_symbols', label: 'Handling/storage symbols applied', type: 'richtext', helpText: 'List symbols used: temperature limit (5.3.7), humidity limitation (5.3.8), keep dry (5.3.4), fragile (5.3.1), do not use if package is damaged (5.2.8).' },
          { id: 'storage_conditions', label: 'Corresponding storage conditions', type: 'richtext', helpText: 'Specify the actual storage conditions (e.g., 15–25°C, <60% RH) that match the symbols applied.' },
        ],
      },
    ],
  },
  '5.3': {
    clauseTitle: '5.3 — Sterility and Safety Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_sterility',
        stepLabel: 'Sterility Symbols',
        requirementText: 'Apply sterilisation method symbols, do not re-sterilise, non-sterile, and biological hazard symbols where applicable.',
        fields: [
          { id: 'sterility_symbols', label: 'Sterility-related symbols applied', type: 'richtext', helpText: 'List applicable symbols: sterile (5.2.1–5.2.6), do not re-sterilise (5.2.7), non-sterile (5.2.9), biological hazard (5.4.2).' },
          { id: 'applicability_note', label: 'Applicability justification', type: 'richtext', helpText: 'If the device is non-sterile, confirm which symbols are not applicable and why.' },
        ],
      },
    ],
  },
  '5.4': {
    clauseTitle: '5.4 — IVD and Transfusion Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '5.4_ivd',
        stepLabel: 'IVD / Transfusion Symbols',
        requirementText: 'Apply in vitro diagnostic, single use, do not re-use, and specific IVD/transfusion symbols where applicable.',
        fields: [
          { id: 'ivd_symbols', label: 'IVD/transfusion symbols applied', type: 'richtext', helpText: 'List applicable symbols: single use (5.4.4), do not re-use (5.4.3), IVD (5.5.1), sample volume (5.5.4). State N/A if not an IVD.' },
        ],
      },
    ],
  },
  '5.5': {
    clauseTitle: '5.5 — Warnings and Regulatory Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: '5.5_warnings',
        stepLabel: 'Warning & Regulatory Symbols',
        requirementText: 'Apply caution, consult IFU, CE marking, and regulatory compliance symbols.',
        fields: [
          { id: 'warning_symbols', label: 'Warning/regulatory symbols applied', type: 'richtext', helpText: 'List symbols: caution (5.4.4), consult IFU (5.4.3), CE marking, UKCA mark, authorized representative (5.1.2). Include regulatory markings.' },
          { id: 'ce_marking_ref', label: 'CE / regulatory marking evidence', type: 'doc_reference', helpText: 'Link to evidence of correct CE marking application (if applicable).' },
        ],
      },
    ],
  },
  '6.1': {
    clauseTitle: '6.1 — Symbol Verification with Target Users',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_verification',
        stepLabel: 'User Comprehension',
        requirementText: 'Verify symbol comprehension with intended users per ISO 15223-1 Annex requirements.',
        fields: [
          { id: 'verification_approach', label: 'Verification approach', type: 'richtext', helpText: 'Describe how symbol comprehension was verified. ISO 15223-1 references ISO 9186 for comprehension testing methodology.' },
          { id: 'verification_results', label: 'Verification results', type: 'richtext', helpText: 'Summarize comprehension test results or justification for why verification was not required (e.g., widely-known standardised symbols).' },
        ],
      },
    ],
  },
  '6.2': {
    clauseTitle: '6.2 — Documentation of Symbol Usage',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_docs',
        stepLabel: 'Symbol Documentation',
        requirementText: 'Maintain records of all symbols used, their meaning, and conformity to ISO 15223-1 in the technical file.',
        fields: [
          { id: 'symbol_register', label: 'Symbol register / glossary', type: 'richtext', helpText: 'Describe the maintained register listing every symbol, its ISO 15223-1 reference, meaning, and where it appears on the device/packaging.' },
          { id: 'tech_file_ref', label: 'Technical file section reference', type: 'doc_reference', required: true, helpText: 'Link to the technical file section containing the symbol documentation.' },
        ],
      },
    ],
  },
};
