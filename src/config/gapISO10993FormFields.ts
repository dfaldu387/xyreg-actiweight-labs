/**
 * ISO 10993-1:2025 Biocompatibility — Clause-Specific Form Field Definitions
 * Aligned to EN ISO 10993-1:2025 clause structure.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_10993_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  /* ── Clause 4: General Principles ── */
  '4.1': {
    clauseTitle: '4.1 — Biological Evaluation within ISO 14971 Risk Management Framework',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_integration',
        stepLabel: 'Risk Management Integration',
        requirementText: 'Integrate biological evaluation into the risk management process per ISO 14971.',
        fields: [
          { id: 'rm_integration', label: 'How is biological evaluation integrated into risk management?', type: 'richtext', helpText: 'Describe how biological hazards are identified, analysed, and controlled within the risk management framework.' },
          { id: 'risk_file_ref', label: 'Risk management file reference', type: 'doc_reference', helpText: 'Link to the risk management file showing biological hazard entries.' },
        ],
      },
    ],
  },
  '4.2': {
    clauseTitle: '4.2 — Biological Evaluation Process',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_process',
        stepLabel: 'Evaluation Process',
        requirementText: 'Establish and document the biological evaluation process covering all phases from planning through post-production.',
        fields: [
          { id: 'eval_process', label: 'Biological evaluation process description', type: 'richtext', helpText: 'Describe the overall process including planning, risk analysis, testing, risk evaluation, risk control, and reporting phases.' },
          { id: 'process_doc_ref', label: 'Process document reference', type: 'doc_reference', helpText: 'Link to the procedure or SOP governing biological evaluation.' },
        ],
      },
    ],
  },
  '4.3': {
    clauseTitle: '4.3 — Medical Device Life Cycle',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_lifecycle',
        stepLabel: 'Life Cycle Considerations',
        requirementText: 'Consider the entire medical device life cycle in the biological evaluation.',
        fields: [
          { id: 'lifecycle_scope', label: 'Life cycle scope', type: 'richtext', helpText: 'Describe how design changes, manufacturing processes, sterilization, ageing, and transport/storage are considered in the biological evaluation.' },
        ],
      },
    ],
  },
  '4.4': {
    clauseTitle: '4.4 — Animal Welfare',
    evidenceRequired: false,
    steps: [
      {
        id: '4.4_3rs',
        stepLabel: '3Rs Principle',
        requirementText: 'Apply the 3Rs principle (Replacement, Reduction, Refinement) and justify any use of animal testing.',
        fields: [
          { id: 'animal_justification', label: '3Rs justification', type: 'richtext', helpText: 'Document how the 3Rs were applied. If animal testing is used, justify why in vitro or in silico alternatives are not suitable.' },
        ],
      },
    ],
  },

  /* ── Clause 5: Biological Evaluation Plan ── */
  '5': {
    clauseTitle: '5 — Biological Evaluation Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '5_plan',
        stepLabel: 'Evaluation Plan',
        requirementText: 'Document a biological evaluation plan identifying device description, materials, intended use, applicable endpoints, and rationale.',
        fields: [
          { id: 'bio_eval_plan', label: 'Biological evaluation plan description', type: 'richtext', helpText: 'Describe the plan scope, device description, materials, body contact nature/duration, applicable endpoints, and testing strategy.' },
          { id: 'plan_doc_ref', label: 'Biological evaluation plan document', type: 'doc_reference', required: true, helpText: 'Link to the formal biological evaluation plan document.' },
        ],
      },
      {
        id: '5_endpoints',
        stepLabel: 'Endpoint Strategy',
        requirementText: 'Identify applicable biological endpoints and justify the evaluation strategy.',
        fields: [
          { id: 'endpoint_matrix', label: 'Applicable endpoints', type: 'richtext', helpText: 'List all applicable biological effects for evaluation with justification based on device categorization.' },
          { id: 'endpoint_justification', label: 'Justification for excluded endpoints', type: 'richtext', helpText: 'For any endpoints not addressed, provide scientific rationale for exclusion.' },
        ],
      },
    ],
  },

  /* ── Clause 6.1–6.4: Risk Analysis — Characterization & Categorization ── */
  '6.1': {
    clauseTitle: '6.1 — General Approach to Biological Risk Analysis',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_approach',
        stepLabel: 'Risk Analysis Approach',
        requirementText: 'Describe the general approach to identifying biological hazards.',
        fields: [
          { id: 'risk_approach', label: 'Risk analysis approach', type: 'richtext', helpText: 'Describe how existing data, chemical characterization, literature, and testing are used to identify biological hazards.' },
        ],
      },
    ],
  },
  '6.2': {
    clauseTitle: '6.2 — Identification of Characteristics Related to Biological Safety',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_materials',
        stepLabel: 'Material Identification',
        requirementText: 'Identify and characterize all materials including chemical composition, additives, processing aids, and degradation products.',
        fields: [
          { id: 'material_list', label: 'Complete material inventory', type: 'richtext', helpText: 'List all materials in direct/indirect patient contact with trade names, suppliers, chemical compositions, and grades.' },
          { id: 'material_specs', label: 'Material specifications / certificates', type: 'doc_reference', helpText: 'Link to material data sheets, certificates of analysis, or supplier specifications.' },
        ],
      },
      {
        id: '6.2_additives',
        stepLabel: 'Additives & Processing Aids',
        requirementText: 'Document additives, colourants, processing aids, sterilization residues, and potential degradation products.',
        fields: [
          { id: 'additives_info', label: 'Additives and processing aids', type: 'richtext', helpText: 'List any additives (plasticizers, stabilizers, colourants), processing residues, and sterilization residues. Include concentrations.' },
        ],
      },
    ],
  },
  '6.3': {
    clauseTitle: '6.3 — Identification of Biological Hazards, Hazardous Situations, and Potential Harms',
    evidenceRequired: true,
    steps: [
      {
        id: '6.3_hazards',
        stepLabel: 'Hazard Identification',
        requirementText: 'Systematically identify biological hazards and hazardous situations.',
        fields: [
          { id: 'hazard_list', label: 'Identified biological hazards', type: 'richtext', helpText: 'List all identified biological hazards from device materials, degradation products, and manufacturing residues.' },
          { id: 'hazard_situations', label: 'Hazardous situations and potential harms', type: 'richtext', helpText: 'Describe the hazardous situations that could arise and the potential harms to the patient.' },
        ],
      },
    ],
  },
  '6.4': {
    clauseTitle: '6.4 — Categorization of Medical Device and Determination of Scope',
    evidenceRequired: true,
    steps: [
      {
        id: '6.4_contact',
        stepLabel: 'Body Contact Categorization',
        requirementText: 'Categorize by nature of body contact using Tables 1–4.',
        fields: [
          { id: 'contact_type', label: 'Nature of body contact', type: 'select', options: ['Surface contacting device', 'Tissue/bone contacting device', 'Circulating blood contacting device'], helpText: 'Select the highest-risk contact category applicable per Tables 1–4.' },
          { id: 'contact_description', label: 'Contact description', type: 'richtext', helpText: 'Describe which tissues/fluids the device contacts.' },
        ],
      },
      {
        id: '6.4_duration',
        stepLabel: 'Exposure Duration',
        requirementText: 'Categorize by exposure duration: limited (≤24h), prolonged (>24h to 30d), or long-term (>30d).',
        fields: [
          { id: 'contact_duration', label: 'Exposure duration category', type: 'select', options: ['Limited (≤24 hours)', 'Prolonged (>24h to 30 days)', 'Long-term (>30 days)'], helpText: 'Select based on single-use or cumulative exposure duration.' },
          { id: 'duration_justification', label: 'Duration justification', type: 'richtext', helpText: 'Justify the duration category, especially if cumulative exposure applies.' },
        ],
      },
    ],
  },

  /* ── Clause 6.5: Biological Effects for Evaluation ── */
  '6.5.1': {
    clauseTitle: '6.5.1 — Overall Approach to Biological Effects',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.1_approach',
        stepLabel: 'Effects Selection Approach',
        requirementText: 'Describe the overall approach for selecting applicable biological effects.',
        fields: [
          { id: 'effects_approach', label: 'Approach to biological effects selection', type: 'richtext', helpText: 'Describe how applicable biological effects were selected based on device categorization and risk analysis.' },
        ],
      },
    ],
  },
  '6.5.2': {
    clauseTitle: '6.5.2 — Cytotoxicity',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.2_test',
        stepLabel: 'Cytotoxicity Testing',
        requirementText: 'Evaluate cytotoxicity using in vitro methods per ISO 10993-5.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['Direct contact', 'Agar overlay', 'Elution (MEM)', 'Other'], helpText: 'Select the in vitro cytotoxicity test method used.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize pass/fail results, cell viability data, and grading.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the full cytotoxicity test report.' },
        ],
      },
    ],
  },
  '6.5.3': {
    clauseTitle: '6.5.3 — Sensitization',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.3_test',
        stepLabel: 'Sensitization Testing',
        requirementText: 'Evaluate sensitization potential per ISO 10993-10.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['GPMT (Guinea Pig Maximisation Test)', 'Buehler test', 'LLNA (Local Lymph Node Assay)', 'KeratinoSens / h-CLAT / DPRA (in vitro)', 'Other'], helpText: 'Select the sensitization test method. In vitro methods are preferred.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results including sensitization rate/score and conclusion.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the full sensitization test report.' },
        ],
      },
    ],
  },
  '6.5.4': {
    clauseTitle: '6.5.4 — Irritation',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.4_test',
        stepLabel: 'Irritation Testing',
        requirementText: 'Evaluate irritation or intracutaneous reactivity per ISO 10993-10/23.',
        fields: [
          { id: 'test_method', label: 'Test method used', type: 'select', options: ['Intracutaneous reactivity test', 'In vitro skin irritation (RhE)', 'Ocular irritation test', 'Other'], helpText: 'Select the appropriate irritation test method.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize irritation scores and conclusion.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the irritation test report.' },
        ],
      },
    ],
  },
  '6.5.5': {
    clauseTitle: '6.5.5 — Systemic Toxicity',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.5_acute',
        stepLabel: 'Acute Systemic Toxicity',
        requirementText: 'Evaluate acute systemic toxicity per ISO 10993-11.',
        fields: [
          { id: 'acute_test', label: 'Acute systemic toxicity evaluation', type: 'richtext', helpText: 'Describe the test method, observations, and conclusion.' },
          { id: 'acute_report_ref', label: 'Acute toxicity test report', type: 'doc_reference', helpText: 'Link to the acute systemic toxicity test report.' },
        ],
      },
      {
        id: '6.5.5_subchronic',
        stepLabel: 'Sub-chronic / Chronic Toxicity',
        requirementText: 'Evaluate sub-chronic or chronic systemic toxicity for prolonged/long-term contact devices.',
        fields: [
          { id: 'subchronic_test', label: 'Sub-chronic/chronic toxicity evaluation', type: 'richtext', helpText: 'Describe the evaluation. If not performed, provide justification based on chemical characterization and TRA.' },
          { id: 'subchronic_report_ref', label: 'Test report / justification', type: 'doc_reference', helpText: 'Link to test report or documented justification.' },
        ],
      },
    ],
  },
  '6.5.6': {
    clauseTitle: '6.5.6 — Local Effects after Tissue Contact',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.6_test',
        stepLabel: 'Local Effects Testing',
        requirementText: 'Evaluate local effects after implantation or tissue contact per ISO 10993-6.',
        fields: [
          { id: 'test_description', label: 'Local effects test description', type: 'richtext', helpText: 'Describe the implantation model, site, duration, and histological evaluation approach.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize histological findings, tissue response scores, and conclusion.' },
          { id: 'test_report_ref', label: 'Test report', type: 'doc_reference', required: true, helpText: 'Link to the local effects / implantation study report.' },
        ],
      },
    ],
  },
  '6.5.7': {
    clauseTitle: '6.5.7 — Genotoxicity',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.7_test',
        stepLabel: 'Genotoxicity Testing',
        requirementText: 'Evaluate genotoxicity using a battery of tests per ISO 10993-3.',
        fields: [
          { id: 'test_battery', label: 'Test battery used', type: 'richtext', helpText: 'Describe the test battery (e.g., Ames test, in vitro micronucleus, in vivo follow-up if needed).' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results of each assay and overall conclusion.' },
          { id: 'test_report_ref', label: 'Genotoxicity test reports', type: 'doc_reference', required: true, helpText: 'Link to the genotoxicity test reports.' },
        ],
      },
    ],
  },
  '6.5.8': {
    clauseTitle: '6.5.8 — Carcinogenicity',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.8_eval',
        stepLabel: 'Carcinogenicity Evaluation',
        requirementText: 'Evaluate carcinogenicity potential where applicable.',
        fields: [
          { id: 'carcino_approach', label: 'Carcinogenicity evaluation approach', type: 'richtext', helpText: 'Describe the approach: literature review, material composition analysis, genotoxicity data extrapolation, or specific carcinogenicity testing.' },
          { id: 'carcino_conclusion', label: 'Conclusion', type: 'richtext', helpText: 'Summarize whether carcinogenicity risk is acceptable based on available evidence.' },
          { id: 'carcino_report_ref', label: 'Supporting documentation', type: 'doc_reference', helpText: 'Link to carcinogenicity evaluation or justification document.' },
        ],
      },
    ],
  },
  '6.5.9': {
    clauseTitle: '6.5.9 — Haemocompatibility',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.9_test',
        stepLabel: 'Haemocompatibility Testing',
        requirementText: 'Evaluate haemocompatibility for blood-contacting devices per ISO 10993-4.',
        fields: [
          { id: 'test_categories', label: 'Test categories evaluated', type: 'richtext', helpText: 'List which categories were tested: thrombosis, coagulation, platelets, haematology, complement activation.' },
          { id: 'test_results', label: 'Test results summary', type: 'richtext', helpText: 'Summarize results for each category and overall conclusion.' },
          { id: 'test_report_ref', label: 'Haemocompatibility test report', type: 'doc_reference', required: true, helpText: 'Link to the haemocompatibility test report.' },
        ],
      },
    ],
  },
  '6.5.10': {
    clauseTitle: '6.5.10 — Other Biological Effects',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5.10_eval',
        stepLabel: 'Other Effects Evaluation',
        requirementText: 'Evaluate immunotoxicity, neurotoxicity, reproductive/developmental toxicity, and material-mediated pyrogenicity where applicable.',
        fields: [
          { id: 'other_effects', label: 'Applicable other biological effects', type: 'richtext', helpText: 'Identify which additional effects are applicable and how they were evaluated. If not applicable, provide justification.' },
          { id: 'other_report_ref', label: 'Supporting documentation', type: 'doc_reference', helpText: 'Link to evaluation reports or justification documents.' },
        ],
      },
    ],
  },
  '6.5.11': {
    clauseTitle: '6.5.11 — Other Factors to Consider',
    evidenceRequired: false,
    steps: [
      {
        id: '6.5.11_factors',
        stepLabel: 'Additional Factors',
        requirementText: 'Consider factors such as brief contact, low-risk skin contact, absorption, materials that change, degradation, particulates, toxicokinetics, and hazardous constituents.',
        fields: [
          { id: 'other_factors', label: 'Other factors considered', type: 'richtext', helpText: 'Document any additional factors considered and their impact on the biological evaluation.' },
        ],
      },
    ],
  },

  /* ── Clause 6.6–6.9: Gap Analysis, Equivalence & Testing ── */
  '6.6': {
    clauseTitle: '6.6 — Gap Analysis',
    evidenceRequired: true,
    steps: [
      {
        id: '6.6_gap',
        stepLabel: 'Data Gap Analysis',
        requirementText: 'Compare available data against required biological endpoints and identify gaps.',
        fields: [
          { id: 'gap_analysis', label: 'Gap analysis summary', type: 'richtext', helpText: 'Document all required endpoints, available data for each, and identified gaps requiring further evaluation.' },
          { id: 'gap_doc_ref', label: 'Gap analysis document', type: 'doc_reference', helpText: 'Link to the gap analysis document or matrix.' },
        ],
      },
    ],
  },
  '6.7': {
    clauseTitle: '6.7 — Biological Equivalence',
    evidenceRequired: true,
    steps: [
      {
        id: '6.7_equiv',
        stepLabel: 'Equivalence Assessment',
        requirementText: 'Evaluate biological equivalence to predicate or similar devices.',
        fields: [
          { id: 'equiv_basis', label: 'Equivalence basis', type: 'richtext', helpText: 'Describe the predicate device and demonstrate equivalence in material, manufacturing, sterilization, geometry, and body contact.' },
          { id: 'equiv_limitations', label: 'Limitations of equivalence claim', type: 'richtext', helpText: 'Document any differences and their impact on biological safety conclusions.' },
          { id: 'equiv_doc_ref', label: 'Equivalence assessment document', type: 'doc_reference', helpText: 'Link to the biological equivalence assessment.' },
        ],
      },
    ],
  },
  '6.8': {
    clauseTitle: '6.8 — Testing',
    evidenceRequired: true,
    steps: [
      {
        id: '6.8_bio_test',
        stepLabel: 'Biological Testing',
        requirementText: 'Plan and conduct biological testing where needed.',
        fields: [
          { id: 'bio_testing', label: 'Biological testing summary', type: 'richtext', helpText: 'Summarize biological tests conducted, methods, and results.' },
        ],
      },
      {
        id: '6.8_chem_test',
        stepLabel: 'Chemical & Degradation Testing',
        requirementText: 'Conduct chemical characterization (ISO 10993-18), toxicological risk assessment (ISO 10993-17), and degradation testing where applicable.',
        fields: [
          { id: 'chem_char', label: 'Chemical characterization (extractables/leachables)', type: 'richtext', helpText: 'Describe extraction conditions, analytical methods, and identified chemicals.' },
          { id: 'tra', label: 'Toxicological risk assessment', type: 'richtext', helpText: 'Summarize TRA methodology and conclusions for identified chemicals.' },
          { id: 'degradation', label: 'Degradation testing', type: 'richtext', helpText: 'Describe degradation testing approach and results, if applicable.' },
          { id: 'chem_report_ref', label: 'Chemical characterization / TRA reports', type: 'doc_reference', required: true, helpText: 'Link to the chemical characterization and TRA reports.' },
        ],
      },
    ],
  },
  '6.9': {
    clauseTitle: '6.9 — Biological Risk Estimation',
    evidenceRequired: true,
    steps: [
      {
        id: '6.9_estimation',
        stepLabel: 'Risk Estimation',
        requirementText: 'Estimate biological risk for each identified hazardous situation.',
        fields: [
          { id: 'risk_estimation', label: 'Biological risk estimation', type: 'richtext', helpText: 'Describe how severity and probability of harm were estimated for each biological hazard.' },
          { id: 'risk_matrix_ref', label: 'Risk estimation matrix', type: 'doc_reference', helpText: 'Link to the biological risk estimation in the risk management file.' },
        ],
      },
    ],
  },

  /* ── Clause 7–8: Risk Evaluation & Control ── */
  '7': {
    clauseTitle: '7 — Biological Risk Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '7_evaluation',
        stepLabel: 'Risk Evaluation',
        requirementText: 'Evaluate estimated risks against acceptability criteria.',
        fields: [
          { id: 'risk_eval', label: 'Risk evaluation summary', type: 'richtext', helpText: 'Summarize risk evaluation results: which risks are acceptable, which require further control, and any benefit-risk analysis performed.' },
          { id: 'risk_eval_ref', label: 'Risk evaluation document', type: 'doc_reference', helpText: 'Link to the risk evaluation section of the risk management file.' },
        ],
      },
    ],
  },
  '8': {
    clauseTitle: '8 — Biological Risk Control',
    evidenceRequired: true,
    steps: [
      {
        id: '8_control',
        stepLabel: 'Risk Control Measures',
        requirementText: 'Implement and verify risk control measures for unacceptable biological risks.',
        fields: [
          { id: 'risk_controls', label: 'Risk control measures', type: 'richtext', helpText: 'Describe risk control measures implemented: inherent safety by design, protective measures, and/or information for safety.' },
          { id: 'control_verification', label: 'Verification of effectiveness', type: 'richtext', helpText: 'Describe how risk control effectiveness was verified.' },
          { id: 'control_doc_ref', label: 'Risk control documentation', type: 'doc_reference', helpText: 'Link to risk control verification records.' },
        ],
      },
    ],
  },

  /* ── Clause 9–10: Reporting & Post-Production ── */
  '9': {
    clauseTitle: '9 — Biological Evaluation Report',
    evidenceRequired: true,
    steps: [
      {
        id: '9_report',
        stepLabel: 'Evaluation Report',
        requirementText: 'Compile a comprehensive biological evaluation report.',
        fields: [
          { id: 'report_summary', label: 'Report summary and conclusions', type: 'richtext', helpText: 'Summarize overall conclusions: endpoints addressed, results, and biocompatibility determination.' },
          { id: 'endpoint_coverage', label: 'Endpoint coverage matrix', type: 'richtext', helpText: 'Confirm all required endpoints have been addressed or provide justification for gaps.' },
          { id: 'bio_eval_report_ref', label: 'Biological evaluation report', type: 'doc_reference', required: true, helpText: 'Link to the final biological evaluation report.' },
        ],
      },
    ],
  },
  '10': {
    clauseTitle: '10 — Production and Post-Production Activities',
    evidenceRequired: true,
    steps: [
      {
        id: '10_postprod',
        stepLabel: 'Post-Production Monitoring',
        requirementText: 'Establish processes for collecting and reviewing production and post-production information.',
        fields: [
          { id: 'postprod_process', label: 'Post-production monitoring process', type: 'richtext', helpText: 'Describe the process for collecting and reviewing complaints, adverse events, material changes, and other post-production information relevant to biological safety.' },
          { id: 'postprod_doc_ref', label: 'Post-production procedure', type: 'doc_reference', helpText: 'Link to the post-production monitoring procedure or PMS plan section covering biocompatibility.' },
        ],
      },
    ],
  },
};
