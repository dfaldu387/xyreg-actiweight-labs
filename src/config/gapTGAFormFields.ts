/**
 * TGA (Australia) — Clause-Specific Form Field Definitions
 */
import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const TGA_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '1': {
    clauseTitle: '1 — Device Classification',
    evidenceRequired: true,
    steps: [
      { id: '1_class', stepLabel: 'Classification', requirementText: 'Classify the device per TGA classification rules (Class I, IIa, IIb, III, AIMD).', fields: [
        { id: 'device_class', label: 'TGA device class', type: 'select', options: ['Class I', 'Class IIa', 'Class IIb', 'Class III', 'AIMD'], required: true, helpText: 'Select the TGA classification.' },
        { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Explain the classification rule(s) applied.' },
        { id: 'classification_doc', label: 'Classification document', type: 'doc_reference', helpText: 'Link to formal classification document.' },
      ]},
    ],
  },
  '2': {
    clauseTitle: '2 — Australian Sponsor Registration',
    evidenceRequired: true,
    steps: [
      { id: '2_sponsor', stepLabel: 'Sponsor Details', requirementText: 'Register as an Australian sponsor with the TGA.', fields: [
        { id: 'sponsor_name', label: 'Australian sponsor name', type: 'text', required: true, helpText: 'Name of the registered Australian sponsor.' },
        { id: 'sponsor_number', label: 'Sponsor client ID', type: 'text', helpText: 'TGA client ID number for the sponsor.' },
        { id: 'sponsor_doc', label: 'Sponsor registration confirmation', type: 'doc_reference', helpText: 'Link to TGA sponsor registration confirmation.' },
      ]},
    ],
  },
  '3': {
    clauseTitle: '3 — ARTG Inclusion',
    evidenceRequired: true,
    steps: [
      { id: '3_artg', stepLabel: 'ARTG Entry', requirementText: 'Include the device on the Australian Register of Therapeutic Goods (ARTG).', fields: [
        { id: 'artg_number', label: 'ARTG number', type: 'text', helpText: 'Enter the ARTG number once issued.' },
        { id: 'artg_application', label: 'ARTG application / inclusion', type: 'doc_reference', required: true, helpText: 'Link to the ARTG application or inclusion certificate.' },
      ]},
    ],
  },
  '4': {
    clauseTitle: '4 — Conformity Assessment Procedures',
    evidenceRequired: true,
    steps: [
      { id: '4_ca', stepLabel: 'Conformity Assessment', requirementText: 'Complete conformity assessment and obtain certification from a TGA-recognised body.', fields: [
        { id: 'ca_body', label: 'Conformity assessment body', type: 'text', required: true, helpText: 'Name of the TGA-recognised conformity assessment body.' },
        { id: 'ca_certificate', label: 'Conformity assessment certificate', type: 'doc_reference', required: true, helpText: 'Link to the conformity assessment certificate.' },
      ]},
    ],
  },
  '5': {
    clauseTitle: '5 — Essential Principles of Safety and Performance',
    evidenceRequired: true,
    steps: [
      { id: '5_ep', stepLabel: 'Essential Principles', requirementText: 'Demonstrate compliance with Essential Principles per TGO 110.', fields: [
        { id: 'ep_checklist', label: 'Essential principles checklist', type: 'richtext', required: true, helpText: 'Document compliance with each applicable essential principle from TGO 110.' },
        { id: 'ep_doc', label: 'Essential principles compliance document', type: 'doc_reference', required: true, helpText: 'Link to the essential principles compliance checklist.' },
      ]},
    ],
  },
  '6': {
    clauseTitle: '6 — Technical Documentation',
    evidenceRequired: true,
    steps: [
      { id: '6_tech', stepLabel: 'Technical File', requirementText: 'Maintain technical documentation supporting conformity with essential principles.', fields: [
        { id: 'tech_doc_summary', label: 'Technical documentation summary', type: 'richtext', helpText: 'Summarize the technical file structure and key contents.' },
        { id: 'tech_doc', label: 'Technical documentation', type: 'doc_reference', required: true, helpText: 'Link to the technical documentation / technical file.' },
      ]},
    ],
  },
  '7': {
    clauseTitle: '7 — Labelling (TGO 91/92)',
    evidenceRequired: true,
    steps: [
      { id: '7_label', stepLabel: 'Australian Labelling', requirementText: 'Ensure labelling complies with TGO 91 (general) and TGO 92 (IVDs).', fields: [
        { id: 'tgo_applicable', label: 'Applicable TGO', type: 'select', options: ['TGO 91 (General)', 'TGO 92 (IVD)', 'Both'], required: true, helpText: 'Select which therapeutic goods order applies.' },
        { id: 'label_content', label: 'Label content compliance', type: 'richtext', helpText: 'Confirm inclusion of required elements: sponsor name, ARTG number, directions, warnings.' },
        { id: 'label_specimen', label: 'Label specimen', type: 'doc_reference', required: true, helpText: 'Link to approved label artwork for the Australian market.' },
      ]},
    ],
  },
  '8': {
    clauseTitle: '8 — Post-Market Obligations',
    evidenceRequired: true,
    steps: [
      { id: '8_pms', stepLabel: 'Post-Market Systems', requirementText: 'Establish systems for adverse event reporting, recalls, and post-market surveillance.', fields: [
        { id: 'ae_reporting', label: 'Adverse event reporting procedure', type: 'richtext', required: true, helpText: 'Describe the procedure for reporting adverse events to TGA within required timelines.' },
        { id: 'pms_plan', label: 'Post-market surveillance plan', type: 'doc_reference', required: true, helpText: 'Link to the PMS plan covering the Australian market.' },
      ]},
    ],
  },
  '9': {
    clauseTitle: '9 — Clinical Evidence',
    evidenceRequired: true,
    steps: [
      { id: '9_clinical', stepLabel: 'Clinical Data', requirementText: 'Provide clinical evidence per TGA clinical evidence guidelines.', fields: [
        { id: 'clinical_strategy', label: 'Clinical evidence strategy', type: 'richtext', required: true, helpText: 'Describe the clinical evidence approach: literature, clinical investigation, or equivalence.' },
        { id: 'clinical_doc', label: 'Clinical evidence package', type: 'doc_reference', required: true, helpText: 'Link to the clinical evaluation report or clinical study data.' },
      ]},
    ],
  },
};
