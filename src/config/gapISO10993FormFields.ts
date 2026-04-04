/**
 * ISO 10993 Biocompatibility — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for biological evaluation (§4.1–6.3).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_10993_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '4.1': {
    clauseTitle: '4.1 — Biological Evaluation Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_plan',
        stepLabel: 'Evaluation Plan',
        requirementText: 'Establish a biological evaluation plan within the risk management process addressing material characterization and endpoint selection.',
        fields: [
          { id: 'bio_eval_plan', label: 'Biological evaluation plan description', type: 'richtext', helpText: 'Describe the plan scope, device description, materials, body contact nature/duration, and applicable endpoints.' },
          { id: 'plan_doc_ref', label: 'Biological evaluation plan document', type: 'doc_reference', required: true, helpText: 'Link to the formal biological evaluation plan document.' },
        ],
      },
      {
        id: '4.1_risk_integration',
        stepLabel: 'Risk Management Integration',
        requirementText: 'Demonstrate integration of the biological evaluation into the risk management process.',
        fields: [
          { id: 'risk_integration', label: 'Integration with risk management', type: 'richtext', helpText: 'Explain how biological hazards are identified, analysed, and controlled within the risk management file.' },
          { id: 'risk_file_ref', label: 'Risk management file reference', type: 'doc_reference', helpText: 'Link to the risk management file showing biological hazard entries.' },
        ],
      },
    ],
  },
  '4.2': {
    clauseTitle: '4.2 — Material Characterization',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_materials',
        stepLabel: 'Material Identification',
        requirementText: 'Characterize all materials including chemical composition, additives, processing aids, and degradation products.',
        fields: [
          { id: 'material_list', label: 'Complete material inventory', type: 'richtext', helpText: 'List all materials in direct/indirect patient contact with trade names, suppliers, chemical compositions, and grades.' },
          { id: 'material_specs', label: 'Material specifications / certificates', type: 'doc_reference', helpText: 'Link to material data sheets, certificates of analysis, or supplier specifications.' },
        ],
      },
      {
        id: '4.2_additives',
        stepLabel: 'Additives & Processing Aids',
        requirementText: 'Document additives, colourants, processing aids, and potential degradation products.',
        fields: [
          { id: 'additives_info', label: 'Additives and processing aids', type: 'richtext', helpText: 'List any additives (plasticizers, stabilizers, colourants) and processing residues. Include concentrations.' },
        ],
      },
    ],
  },
  '4.3': {
    clauseTitle: '4.3 — Device Categorization by Contact Type and Duration',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_contact',
        stepLabel: 'Contact Nature',
        requirementText: 'Categorize by nature of body contact: surface device, external communicating, or implant device.',
        fields: [
          { id: 'contact_type', label: 'Nature of body contact', type: 'select', options: ['Surface device', 'External communicating device', 'Implant device'], helpText: 'Select the highest-risk contact category applicable.' },
          { id: 'contact_description', label: 'Contact description', type: 'richtext', helpText: 'Describe which tissues/fluids the device contacts (e.g., intact skin, mucosal membrane, blood, bone).' },
        ],
      },
      {
        id: '4.3_duration',
        stepLabel: 'Contact Duration',
        requirementText: 'Categorize by contact duration: limited (≤24h), prolonged (>24h to 30d), or permanent (>30d).',
        fields: [
          { id: 'contact_duration', label: 'Contact duration category', type: 'select', options: ['Limited (≤24 hours)', 'Prolonged (>24h to 30 days)', 'Permanent (>30 days)'], helpText: 'Select based on single-use or cumulative exposure duration.' },
          { id: 'duration_justification', label: 'Duration justification', type: 'richtext', helpText: 'Justify the duration category, especially if cumulative exposure applies.' },
        ],
      },
    ],
  },
  '4.4': {
    clauseTitle: '4.4 — Selection of Biological Endpoints',
    evidenceRequired: true,
    steps: [
      {
        id: '4.4_endpoints',
        stepLabel: 'Endpoint Selection',
        requirementText: 'Select applicable biological endpoints based on device categorization using ISO 10993-1 Table A.1.',
        fields: [
          { id: 'endpoint_matrix', label: 'Applicable endpoints from Table A.1', type: 'richtext', helpText: 'List all applicable endpoints (cytotoxicity, sensitization, irritation, systemic toxicity, genotoxicity, implantation, haemocompatibility) with justification.' },
          { id: 'endpoint_justification', label: 'Justification for excluded endpoints', type: 'richtext', helpText: 'For any endpoints not addressed, provide scientific rationale for exclusion.' },
        ],
      },
    ],
  },
  '5.1': {
    clauseTitle: '5.1 — Cytotoxicity (ISO 10993-5)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_test',
        stepLabel: 'Test Method & Results',
        requirementText: 'Evaluate cytotoxicity using in vitro methods per ISO 10993-5.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['Direct contact', 'Agar overlay', 'Elution (MEM)', 'Other'], helpText: 'Select the in vitro cytotoxicity test method used.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize pass/fail results, cell viability data, and grading.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the full cytotoxicity test report from an accredited lab.' },
        ],
      },
    ],
  },
  '5.2': {
    clauseTitle: '5.2 — Sensitization (ISO 10993-10)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_test',
        stepLabel: 'Sensitization Testing',
        requirementText: 'Evaluate sensitization potential using appropriate test methods per ISO 10993-10.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['GPMT (Guinea Pig Maximisation Test)', 'Buehler test', 'LLNA (Local Lymph Node Assay)', 'KeratinoSens / h-CLAT / DPRA (in vitro)', 'Other'], helpText: 'Select the sensitization test method. In vitro methods are preferred where validated.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results including sensitization rate/score and conclusion.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the full sensitization test report.' },
        ],
      },
    ],
  },
  '5.3': {
    clauseTitle: '5.3 — Irritation / Intracutaneous Reactivity (ISO 10993-10/23)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_test',
        stepLabel: 'Irritation Testing',
        requirementText: 'Evaluate irritation or intracutaneous reactivity where applicable.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['Intracutaneous reactivity test', 'Skin irritation test (rabbit)', 'In vitro skin irritation (RhE)', 'Ocular irritation test', 'Other'], helpText: 'Select the appropriate irritation test method for the contact type.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize irritation scores, observations, and conclusion.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the full irritation test report.' },
        ],
      },
    ],
  },
  '5.4': {
    clauseTitle: '5.4 — Systemic Toxicity (ISO 10993-11)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.4_acute',
        stepLabel: 'Acute Systemic Toxicity',
        requirementText: 'Evaluate acute systemic toxicity where applicable per ISO 10993-11.',
        fields: [
          { id: 'acute_test', label: 'Acute systemic toxicity test method and results', type: 'richtext', helpText: 'Describe the test method (e.g., IV/IP injection of extract), observations, and conclusion.' },
          { id: 'acute_report_ref', label: 'Acute toxicity test report', type: 'doc_reference', helpText: 'Link to the acute systemic toxicity test report.' },
        ],
      },
      {
        id: '5.4_subchronic',
        stepLabel: 'Sub-chronic / Chronic Toxicity',
        requirementText: 'Evaluate sub-chronic or chronic systemic toxicity for prolonged/permanent contact devices.',
        fields: [
          { id: 'subchronic_test', label: 'Sub-chronic/chronic toxicity evaluation', type: 'richtext', helpText: 'Describe the evaluation approach. If testing was not performed, provide justification (e.g., based on chemical characterization and toxicological risk assessment).' },
          { id: 'subchronic_report_ref', label: 'Test report / justification document', type: 'doc_reference', helpText: 'Link to the test report or documented justification.' },
        ],
      },
    ],
  },
  '5.5': {
    clauseTitle: '5.5 — Genotoxicity (ISO 10993-3)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.5_test',
        stepLabel: 'Genotoxicity Testing',
        requirementText: 'Evaluate genotoxicity using a battery of in vitro and in vivo tests per ISO 10993-3.',
        fields: [
          { id: 'test_battery', label: 'Test battery used', type: 'richtext', helpText: 'Describe the test battery (e.g., Ames test, mouse lymphoma assay or in vitro micronucleus, in vivo micronucleus if needed).' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results of each assay and overall genotoxicity conclusion.' },
          { id: 'test_report_ref', label: 'Genotoxicity test reports', type: 'doc_reference', required: true, helpText: 'Link to the genotoxicity test reports.' },
        ],
      },
    ],
  },
  '5.6': {
    clauseTitle: '5.6 — Implantation (ISO 10993-6)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.6_test',
        stepLabel: 'Implantation Testing',
        requirementText: 'Evaluate local effects of implantation where applicable per ISO 10993-6.',
        fields: [
          { id: 'test_description', label: 'Implantation test description', type: 'richtext', helpText: 'Describe the implantation model, site, duration, and histological evaluation approach.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize histological findings, tissue response scores, and conclusion.' },
          { id: 'test_report_ref', label: 'Implantation test report', type: 'doc_reference', required: true, helpText: 'Link to the implantation study report.' },
        ],
      },
    ],
  },
  '5.7': {
    clauseTitle: '5.7 — Haemocompatibility (ISO 10993-4)',
    evidenceRequired: true,
    steps: [
      {
        id: '5.7_test',
        stepLabel: 'Haemocompatibility Testing',
        requirementText: 'Evaluate haemocompatibility for devices in contact with blood per ISO 10993-4.',
        fields: [
          { id: 'test_categories', label: 'Haemocompatibility test categories evaluated', type: 'richtext', helpText: 'List which categories were tested: thrombosis, coagulation, platelets, haematology, complement activation.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results for each evaluated category and overall conclusion.' },
          { id: 'test_report_ref', label: 'Haemocompatibility test report', type: 'doc_reference', required: true, helpText: 'Link to the haemocompatibility test report.' },
        ],
      },
    ],
  },
  '6.1': {
    clauseTitle: '6.1 — Chemical Characterization (ISO 10993-18)',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_extractables',
        stepLabel: 'Extractables & Leachables',
        requirementText: 'Perform chemical characterization of device materials and extractables/leachables per ISO 10993-18.',
        fields: [
          { id: 'extraction_conditions', label: 'Extraction conditions used', type: 'richtext', helpText: 'Describe solvents, temperatures, durations, and surface-area-to-volume ratios used for extraction studies.' },
          { id: 'identified_chemicals', label: 'Identified extractables/leachables', type: 'richtext', helpText: 'List all identified chemicals with quantities. Include analytical methods used (GC-MS, LC-MS, ICP, etc.).' },
          { id: 'chem_report_ref', label: 'Chemical characterization report', type: 'doc_reference', required: true, helpText: 'Link to the full chemical characterization report.' },
        ],
      },
    ],
  },
  '6.2': {
    clauseTitle: '6.2 — Toxicological Risk Assessment (ISO 10993-17)',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_tra',
        stepLabel: 'Toxicological Risk Assessment',
        requirementText: 'Conduct toxicological risk assessment of identified chemicals using allowable limits per ISO 10993-17.',
        fields: [
          { id: 'tra_approach', label: 'TRA methodology', type: 'richtext', helpText: 'Describe the approach: tolerable intake (TI) or tolerable contact (TC) calculations, margin of safety analysis, and data sources used.' },
          { id: 'tra_conclusions', label: 'TRA conclusions', type: 'richtext', helpText: 'Summarize whether all identified chemicals are within allowable limits and any residual concerns.' },
          { id: 'tra_report_ref', label: 'Toxicological risk assessment report', type: 'doc_reference', required: true, helpText: 'Link to the formal TRA report.' },
        ],
      },
    ],
  },
  '6.3': {
    clauseTitle: '6.3 — Biological Evaluation Report',
    evidenceRequired: true,
    steps: [
      {
        id: '6.3_report',
        stepLabel: 'Evaluation Report',
        requirementText: 'Compile a biological evaluation report summarizing all testing, risk assessment, and conclusions per ISO 10993-1.',
        fields: [
          { id: 'report_summary', label: 'Report summary and conclusions', type: 'richtext', helpText: 'Summarize the overall biological evaluation conclusions: which endpoints were addressed, results, and overall biocompatibility determination.' },
          { id: 'gap_analysis', label: 'Gap analysis against required endpoints', type: 'richtext', helpText: 'Confirm that all endpoints required by Table A.1 categorization have been addressed, or provide justification for any gaps.' },
          { id: 'bio_eval_report_ref', label: 'Biological evaluation report', type: 'doc_reference', required: true, helpText: 'Link to the final biological evaluation report.' },
        ],
      },
    ],
  },
};
