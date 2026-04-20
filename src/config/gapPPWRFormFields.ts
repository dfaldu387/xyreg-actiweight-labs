/**
 * PPWR (Packaging and Packaging Waste Regulation) — Clause-Specific Form Field Definitions
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const PPWR_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  'PPWR-1.1': {
    clauseTitle: 'PPWR-1.1 — Producer Role Definition',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_1_role',
        stepLabel: 'Economic Operator Role',
        requirementText: 'Define and document the economic operator role (producer, manufacturer, importer, distributor) under PPWR for each packaging type placed on the EU market.',
        fields: [
          { id: 'operator_role', label: 'Economic operator role determination', type: 'richtext', helpText: 'Specify which PPWR economic operator role applies to your organisation for each packaging type (producer, fulfilment service provider, importer, distributor).' },
          { id: 'role_evidence_ref', label: 'Supporting documentation', type: 'doc_reference', helpText: 'Link to contracts, supply agreements, or internal determinations documenting the role.' },
        ],
      },
    ],
  },
  'PPWR-1.2': {
    clauseTitle: 'PPWR-1.2 — PFAS Restrictions Compliance',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_2_pfas',
        stepLabel: 'PFAS Verification',
        requirementText: 'Verify that no packaging or packaging component contains intentionally added PFAS above threshold concentrations.',
        fields: [
          { id: 'pfas_testing', label: 'PFAS testing results', type: 'richtext', helpText: 'Describe testing methodology and results confirming absence of intentionally added PFAS in packaging materials.' },
          { id: 'pfas_supplier_declarations', label: 'Supplier declarations', type: 'doc_reference', helpText: 'Link to supplier declarations or test certificates for PFAS compliance.' },
        ],
      },
    ],
  },
  'PPWR-1.3': {
    clauseTitle: 'PPWR-1.3 — Heavy Metals Compliance',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_3_metals',
        stepLabel: 'Heavy Metals Verification',
        requirementText: 'Confirm lead, cadmium, mercury, and hexavalent chromium concentrations do not exceed 100 ppm.',
        fields: [
          { id: 'metals_testing', label: 'Heavy metals test results', type: 'richtext', helpText: 'Document test results showing sum of Pb, Cd, Hg, Cr(VI) is below 100 ppm for each packaging component.' },
          { id: 'metals_cert_ref', label: 'Test certificates', type: 'doc_reference', helpText: 'Link to accredited laboratory test certificates.' },
        ],
      },
    ],
  },
  'PPWR-1.4': {
    clauseTitle: 'PPWR-1.4 — Substances of Concern Assessment',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_4_soc',
        stepLabel: 'Substances of Concern',
        requirementText: 'Assess all packaging components for SVHC under REACH and CMR substances.',
        fields: [
          { id: 'soc_assessment', label: 'Substances of concern assessment', type: 'richtext', helpText: 'Document the assessment of packaging materials against the REACH SVHC candidate list and CMR classifications.' },
          { id: 'soc_evidence_ref', label: 'Assessment documentation', type: 'doc_reference', helpText: 'Link to REACH compliance assessments or SCIP database submissions.' },
        ],
      },
    ],
  },
  'PPWR-1.5': {
    clauseTitle: 'PPWR-1.5 — Manufacturer Identification on Packaging',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_5_id',
        stepLabel: 'Manufacturer Identification',
        requirementText: 'Ensure manufacturer name, trade name or trademark, and contact address are displayed on the packaging.',
        fields: [
          { id: 'id_checklist', label: 'Identification checklist', type: 'richtext', helpText: 'Confirm packaging displays: manufacturer name, trade name/trademark, postal address, and electronic contact.' },
          { id: 'label_specimen_ref', label: 'Packaging specimen/artwork', type: 'doc_reference', helpText: 'Link to approved packaging artwork showing identification details.' },
        ],
      },
    ],
  },
  'PPWR-1.6': {
    clauseTitle: 'PPWR-1.6 — Packaging Minimisation',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_6_min',
        stepLabel: 'Minimisation Justification',
        requirementText: 'Document justification that packaging weight, volume, and empty space are minimised.',
        fields: [
          { id: 'minimisation_rationale', label: 'Minimisation rationale', type: 'richtext', helpText: 'Document the analysis showing packaging weight and volume are reduced to the minimum adequate amount while maintaining product protection, safety, and hygiene requirements.' },
          { id: 'minimisation_ref', label: 'Packaging design records', type: 'doc_reference', helpText: 'Link to packaging design justification or empty space analysis.' },
        ],
      },
    ],
  },
  'PPWR-1.7': {
    clauseTitle: 'PPWR-1.7 — Technical Documentation for Packaging',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_7_td',
        stepLabel: 'Technical Documentation',
        requirementText: 'Prepare and maintain technical documentation demonstrating conformity with PPWR for 10 years.',
        fields: [
          { id: 'td_contents', label: 'Technical documentation contents', type: 'richtext', helpText: 'List all elements of the PPWR technical documentation: general description, design drawings, test reports, recyclability assessment, sustainability requirements evidence.' },
          { id: 'td_ref', label: 'Technical documentation', type: 'doc_reference', required: true, helpText: 'Link to the complete PPWR technical documentation package.' },
        ],
      },
    ],
  },
  'PPWR-1.8': {
    clauseTitle: 'PPWR-1.8 — Conformity Assessment Procedure',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_8_ca',
        stepLabel: 'Conformity Assessment',
        requirementText: 'Complete conformity assessment (Module A) and draw up the EU declaration of conformity.',
        fields: [
          { id: 'ca_procedure', label: 'Conformity assessment procedure', type: 'richtext', helpText: 'Describe the internal production control (Module A) procedure applied and confirm the EU declaration of conformity has been drawn up.' },
          { id: 'doc_ref', label: 'EU Declaration of Conformity', type: 'doc_reference', required: true, helpText: 'Link to the signed EU declaration of conformity for packaging.' },
        ],
      },
    ],
  },
  'PPWR-1.9': {
    clauseTitle: 'PPWR-1.9 — Economic Operator Obligations',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_9_eoo',
        stepLabel: 'Supply Chain Compliance',
        requirementText: 'Ensure all economic operators in the supply chain comply with their respective PPWR obligations.',
        fields: [
          { id: 'supply_chain_map', label: 'Supply chain compliance mapping', type: 'richtext', helpText: 'Map each economic operator in the packaging supply chain and document how their PPWR obligations are being met.' },
          { id: 'agreements_ref', label: 'Supply agreements', type: 'doc_reference', helpText: 'Link to quality agreements or supplier compliance declarations.' },
        ],
      },
    ],
  },
  'PPWR-1.10': {
    clauseTitle: 'PPWR-1.10 — Packaging Waste Prevention Plan',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_1_10_wp',
        stepLabel: 'Waste Prevention',
        requirementText: 'Establish a waste prevention plan covering packaging reduction targets.',
        fields: [
          { id: 'prevention_plan', label: 'Waste prevention plan', type: 'richtext', helpText: 'Document packaging reduction targets, timeline, and measures to prevent packaging waste generation.' },
          { id: 'plan_ref', label: 'Prevention plan document', type: 'doc_reference', helpText: 'Link to the formal waste prevention plan.' },
        ],
      },
    ],
  },
  'PPWR-2.1': {
    clauseTitle: 'PPWR-2.1 — Harmonised Sorting Labels',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_1_sorting',
        stepLabel: 'Sorting Labels',
        requirementText: 'Apply harmonised sorting labels on all packaging units using delegated act symbols.',
        fields: [
          { id: 'sorting_labels', label: 'Sorting label implementation', type: 'richtext', helpText: 'Document which harmonised sorting labels are applied to each packaging component and their placement.' },
          { id: 'label_ref', label: 'Label artwork', type: 'doc_reference', helpText: 'Link to label artwork showing sorting symbols.' },
        ],
      },
    ],
  },
  'PPWR-2.2': {
    clauseTitle: 'PPWR-2.2 — Recycling Symbols',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_2_recycling',
        stepLabel: 'Recycling Symbols',
        requirementText: 'Display material-specific recycling symbols per harmonised EU standards.',
        fields: [
          { id: 'recycling_symbols', label: 'Recycling symbol compliance', type: 'richtext', helpText: 'Document which recycling symbols are used and confirm they meet the harmonised EU standard format.' },
          { id: 'symbol_ref', label: 'Symbol artwork', type: 'doc_reference', helpText: 'Link to artwork showing recycling symbols.' },
        ],
      },
    ],
  },
  'PPWR-2.3': {
    clauseTitle: 'PPWR-2.3 — Material Identification Marking',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_3_material',
        stepLabel: 'Material Identification',
        requirementText: 'Mark each packaging component with the applicable material identification code.',
        fields: [
          { id: 'material_codes', label: 'Material identification codes', type: 'richtext', helpText: 'List each packaging component and its material identification code (e.g., PET 1, HDPE 2, PP 5).' },
          { id: 'marking_ref', label: 'Marking evidence', type: 'doc_reference', helpText: 'Link to photos or artwork showing material identification markings.' },
        ],
      },
    ],
  },
  'PPWR-2.4': {
    clauseTitle: 'PPWR-2.4 — Digital Labelling (QR Code)',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_4_qr',
        stepLabel: 'QR Code Digital Label',
        requirementText: 'Provide a QR code linking to material composition, recyclability, and reuse information.',
        fields: [
          { id: 'qr_content', label: 'QR code content', type: 'richtext', helpText: 'Describe the information accessible via the QR code: material composition, recyclability grade, reuse instructions, and any deposit-return information.' },
          { id: 'qr_ref', label: 'QR code specimen', type: 'doc_reference', helpText: 'Link to QR code artwork and the landing page content.' },
        ],
      },
    ],
  },
  'PPWR-2.5': {
    clauseTitle: 'PPWR-2.5 — Consumer Information Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_5_consumer',
        stepLabel: 'Consumer Information',
        requirementText: 'Communicate disposal, sorting, and deposit-return scheme information to end-consumers.',
        fields: [
          { id: 'consumer_info', label: 'Consumer information provided', type: 'richtext', helpText: 'Document how disposal, sorting, and deposit-return scheme information is communicated to consumers (on-pack, digital, or both).' },
        ],
      },
    ],
  },
  'PPWR-2.6': {
    clauseTitle: 'PPWR-2.6 — Collection Instructions',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_6_collection',
        stepLabel: 'Collection Instructions',
        requirementText: 'Provide clear separate collection instructions for each packaging component.',
        fields: [
          { id: 'collection_instructions', label: 'Collection instructions', type: 'richtext', helpText: 'Document the separate collection instructions provided for each packaging component.' },
        ],
      },
    ],
  },
  'PPWR-2.7': {
    clauseTitle: 'PPWR-2.7 — Reuse Labelling',
    evidenceRequired: false,
    steps: [
      {
        id: 'ppwr_2_7_reuse',
        stepLabel: 'Reuse Label',
        requirementText: 'Apply harmonised reuse label for reusable packaging.',
        fields: [
          { id: 'reuse_label', label: 'Reuse labelling assessment', type: 'richtext', helpText: 'If packaging is designed for reuse, document the harmonised reuse label applied. If not reusable, document the justification.' },
        ],
      },
    ],
  },
  'PPWR-2.8': {
    clauseTitle: 'PPWR-2.8 — Composite Packaging Marking',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_2_8_composite',
        stepLabel: 'Composite Packaging',
        requirementText: 'Identify each separable material layer in composite packaging.',
        fields: [
          { id: 'composite_layers', label: 'Composite material layers', type: 'richtext', helpText: 'List each separable material layer in composite packaging and its identification marking.' },
        ],
      },
    ],
  },
  'PPWR-3.1': {
    clauseTitle: 'PPWR-3.1 — Design for Recycling Assessment',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_3_1_dfr',
        stepLabel: 'Design for Recycling',
        requirementText: 'Assess packaging against DfR criteria and assign a recyclability grade (A/B/C).',
        fields: [
          { id: 'dfr_assessment', label: 'DfR assessment results', type: 'richtext', helpText: 'Document the Design for Recycling assessment methodology, criteria evaluated, and resulting recyclability grade (A = recyclable at scale, B = recyclable with improvements, C = not recyclable).' },
          { id: 'dfr_ref', label: 'DfR assessment report', type: 'doc_reference', required: true, helpText: 'Link to the complete DfR assessment report.' },
        ],
      },
    ],
  },
  'PPWR-3.2': {
    clauseTitle: 'PPWR-3.2 — Recycled Content Targets',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_3_2_recycled',
        stepLabel: 'Recycled Content',
        requirementText: 'Document recycled content percentages and compliance with applicable targets.',
        fields: [
          { id: 'recycled_content', label: 'Recycled content documentation', type: 'richtext', helpText: 'Document the percentage of post-consumer recycled content in each packaging component and compare against PPWR targets (e.g., 30% by 2030, 65% by 2040 for PET).' },
          { id: 'recycled_cert_ref', label: 'Recycled content certificates', type: 'doc_reference', helpText: 'Link to certificates or supplier declarations for recycled content.' },
        ],
      },
    ],
  },
  'PPWR-3.3': {
    clauseTitle: 'PPWR-3.3 — Compostability Assessment',
    evidenceRequired: false,
    steps: [
      {
        id: 'ppwr_3_3_compost',
        stepLabel: 'Compostability',
        requirementText: 'If applicable, assess compostability of packaging against EN 13432.',
        fields: [
          { id: 'compostability', label: 'Compostability assessment', type: 'richtext', helpText: 'If packaging claims compostability, document testing against EN 13432 and certification status. If not applicable, state justification.' },
        ],
      },
    ],
  },
  'PPWR-4.1': {
    clauseTitle: 'PPWR-4.1 — EPR Registration',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_4_1_epr',
        stepLabel: 'EPR Registration',
        requirementText: 'Register with EPR scheme in each EU Member State where packaging is placed on the market.',
        fields: [
          { id: 'epr_registrations', label: 'EPR registrations', type: 'richtext', helpText: 'List all EU Member States where packaging is placed on the market and the corresponding EPR scheme registration details (scheme name, registration number, date).' },
          { id: 'epr_cert_ref', label: 'Registration certificates', type: 'doc_reference', required: true, helpText: 'Link to EPR registration certificates for each Member State.' },
        ],
      },
    ],
  },
  'PPWR-4.2': {
    clauseTitle: 'PPWR-4.2 — Reporting Obligations',
    evidenceRequired: true,
    steps: [
      {
        id: 'ppwr_4_2_reporting',
        stepLabel: 'Data Reporting',
        requirementText: 'Submit packaging data reports (volume, materials, recyclability) to national authorities.',
        fields: [
          { id: 'reporting_schedule', label: 'Reporting schedule and data', type: 'richtext', helpText: 'Document the reporting schedule, data submitted (packaging volumes, material types, recyclability grades), and confirmation of submission to each national authority.' },
          { id: 'report_ref', label: 'Submitted reports', type: 'doc_reference', helpText: 'Link to copies of submitted packaging data reports.' },
        ],
      },
    ],
  },
  'PPWR-4.3': {
    clauseTitle: 'PPWR-4.3 — Digital Product Passport Readiness',
    evidenceRequired: false,
    steps: [
      {
        id: 'ppwr_4_3_dpp',
        stepLabel: 'Digital Product Passport',
        requirementText: 'Prepare for digital product passport requirements for packaging traceability.',
        fields: [
          { id: 'dpp_readiness', label: 'DPP readiness assessment', type: 'richtext', helpText: 'Document your readiness for the Digital Product Passport requirement: data model, unique identifier system, data carrier (QR code), and IT infrastructure.' },
          { id: 'dpp_ref', label: 'DPP implementation plan', type: 'doc_reference', helpText: 'Link to your DPP implementation roadmap.' },
        ],
      },
    ],
  },
};
