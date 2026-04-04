/**
 * ISO 14971 Device-Level — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for risk management (§3.4–10).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_14971_DEVICE_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §3 Risk Management Plan
  // ═══════════════════════════════════════════════════════════
  '3.4': {
    clauseTitle: '3.4 — Risk Management Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '3.4_scope',
        stepLabel: 'Plan Scope',
        requirementText: 'Define the scope of the risk management plan, including the device(s) covered, lifecycle stages addressed, and any exclusions.',
        fields: [
          { id: 'plan_scope', label: 'Scope of the risk management plan', type: 'richtext', helpText: 'Describe which device(s), variants, and accessories are covered. State the lifecycle stages (design, manufacturing, post-production) included.' },
          { id: 'plan_document_ref', label: 'Risk management plan document reference', type: 'doc_reference', required: true, helpText: 'Link to the formal risk management plan document.' },
        ],
      },
      {
        id: '3.4_responsibilities',
        stepLabel: 'Responsibilities & Authorities',
        requirementText: 'Assign responsibilities and authorities for risk management activities.',
        fields: [
          { id: 'responsibilities', label: 'Assigned responsibilities and authorities', type: 'richtext', helpText: 'List roles (e.g. risk manager, design engineer, QA) and their responsibilities in the risk management process.' },
        ],
      },
      {
        id: '3.4_review_criteria',
        stepLabel: 'Review Criteria & Acceptability',
        requirementText: 'Define criteria for risk acceptability, requirements for review of risk management activities, and verification activities.',
        fields: [
          { id: 'acceptability_criteria', label: 'Criteria for risk acceptability', type: 'richtext', helpText: 'Describe the risk acceptability matrix or policy (e.g. probability × severity matrix, ALARP principle).' },
          { id: 'review_requirements', label: 'Review requirements', type: 'richtext', helpText: 'How and when risk management activities will be reviewed (e.g. design reviews, milestone reviews).' },
          { id: 'verification_activities', label: 'Verification activities', type: 'richtext', helpText: 'Describe how risk control measures will be verified for effectiveness.' },
        ],
      },
      {
        id: '3.4_post_production',
        stepLabel: 'Post-Production Monitoring',
        requirementText: 'Define activities related to collection and review of production and post-production information.',
        fields: [
          { id: 'post_production_plan', label: 'Post-production information collection plan', type: 'richtext', helpText: 'Describe how production and post-production data (complaints, incidents, literature) will feed back into the risk management process.' },
        ],
      },
    ],
  },

  '3.5': {
    clauseTitle: '3.5 — Risk Management File',
    evidenceRequired: true,
    steps: [
      {
        id: '3.5_file',
        stepLabel: 'Risk Management File',
        requirementText: 'Maintain a risk management file containing or referencing all records and documents produced by the risk management process.',
        fields: [
          { id: 'rmf_contents', label: 'Contents of the risk management file', type: 'richtext', helpText: 'List all documents included or referenced: risk management plan, risk analysis, risk evaluation, risk control records, residual risk evaluation, risk management report.' },
          { id: 'rmf_reference', label: 'Risk management file reference', type: 'doc_reference', required: true, helpText: 'Link to the risk management file or its index/table of contents.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §4 Risk Analysis
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Risk Analysis Process',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_process',
        stepLabel: 'Risk Analysis Process',
        requirementText: 'Perform risk analysis: define intended use, identify hazards, estimate risks. Document the process and results.',
        fields: [
          { id: 'analysis_process', label: 'Describe the risk analysis process used', type: 'richtext', helpText: 'Explain the systematic method used (FMEA, FTA, HAZOP, etc.) and how hazards were identified.' },
          { id: 'analysis_doc', label: 'Risk analysis documentation', type: 'doc_reference', required: true, helpText: 'Link to risk analysis records (e.g. FMEA worksheet, hazard analysis report).' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Intended Use and Reasonably Foreseeable Misuse',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_intended_use',
        stepLabel: 'Intended Use & Misuse',
        requirementText: 'Document the intended use, intended users, and reasonably foreseeable misuse of the device.',
        fields: [
          { id: 'intended_use', label: 'Intended use statement', type: 'richtext', helpText: 'Precise statement of what the device is designed to do, for whom, under what conditions.' },
          { id: 'intended_users', label: 'Intended users', type: 'richtext', helpText: 'Describe the intended user profiles (clinicians, patients, lay users, etc.).' },
          { id: 'foreseeable_misuse', label: 'Reasonably foreseeable misuse', type: 'richtext', helpText: 'List potential misuse scenarios that could be reasonably anticipated.' },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — Identification of Safety Characteristics',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_characteristics',
        stepLabel: 'Safety-Related Characteristics',
        requirementText: 'Identify device characteristics that could impact safety, using Annex C of ISO 14971 as a guide.',
        fields: [
          { id: 'safety_characteristics', label: 'Safety-related characteristics identified', type: 'richtext', helpText: 'Use ISO 14971 Annex C as a checklist. Cover energy, biocompatibility, moving parts, materials, sterility, use environment, etc.' },
          { id: 'annex_c_review', label: 'Annex C review completed?', type: 'select', options: ['Yes — all questions addressed', 'Partially — in progress', 'No — not yet started'], helpText: 'Confirm systematic review against Annex C questions.' },
        ],
      },
    ],
  },

  '4.4': {
    clauseTitle: '4.4 — Identification of Hazards and Hazardous Situations',
    evidenceRequired: true,
    steps: [
      {
        id: '4.4_hazards',
        stepLabel: 'Hazard Identification',
        requirementText: 'Systematically identify known and foreseeable hazards in both normal use and fault conditions.',
        fields: [
          { id: 'hazard_identification_method', label: 'Method used for hazard identification', type: 'select', options: ['FMEA', 'FTA (Fault Tree Analysis)', 'HAZOP', 'PHA (Preliminary Hazard Analysis)', 'Brainstorming / Expert review', 'Combination of methods'], helpText: 'Select the primary method(s) used to identify hazards.' },
          { id: 'hazards_summary', label: 'Summary of identified hazards', type: 'richtext', helpText: 'List the key hazard categories identified (energy hazards, biological, chemical, operational, information, etc.).' },
          { id: 'hazard_doc', label: 'Hazard analysis document', type: 'doc_reference', required: true, helpText: 'Link to the hazard analysis worksheet or FMEA.' },
        ],
      },
    ],
  },

  '4.5': {
    clauseTitle: '4.5 — Risk Estimation',
    evidenceRequired: true,
    steps: [
      {
        id: '4.5_estimation',
        stepLabel: 'Risk Estimation',
        requirementText: 'For each identified hazardous situation, estimate the associated risk using probability of occurrence and severity of harm.',
        fields: [
          { id: 'estimation_method', label: 'Risk estimation methodology', type: 'richtext', helpText: 'Describe the scales used for probability and severity, and how risk levels are determined (e.g. risk matrix).' },
          { id: 'risk_matrix_ref', label: 'Risk matrix / estimation tool reference', type: 'doc_reference', helpText: 'Link to the risk matrix or estimation tool used.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Risk Evaluation
  // ═══════════════════════════════════════════════════════════
  '5': {
    clauseTitle: '5 — Risk Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '5_evaluation',
        stepLabel: 'Risk Evaluation',
        requirementText: 'Evaluate each estimated risk against acceptability criteria. Determine which risks require risk control.',
        fields: [
          { id: 'evaluation_results', label: 'Risk evaluation results summary', type: 'richtext', helpText: 'Summarise how many risks fall into each category (acceptable, ALARP, unacceptable). List risks requiring control.' },
          { id: 'evaluation_doc', label: 'Risk evaluation documentation', type: 'doc_reference', required: true, helpText: 'Link to the completed risk evaluation table or matrix.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6 Risk Control
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — Risk Control Option Analysis',
    evidenceRequired: true,
    steps: [
      {
        id: '6.1_options',
        stepLabel: 'Risk Control Options',
        requirementText: 'Analyse risk control options following the priority: inherent safety by design → protective measures → information for safety.',
        fields: [
          { id: 'control_options', label: 'Risk control option analysis', type: 'richtext', helpText: 'For each unacceptable risk, describe the control options considered and the rationale for selection. Show adherence to the priority order.' },
          { id: 'priority_justification', label: 'Priority order justification', type: 'richtext', helpText: 'If a higher-priority measure was not feasible, justify why a lower-priority measure was selected.' },
        ],
      },
    ],
  },

  '6.2': {
    clauseTitle: '6.2 — Implementation of Risk Control Measures',
    evidenceRequired: true,
    steps: [
      {
        id: '6.2_implementation',
        stepLabel: 'Implementation & Verification',
        requirementText: 'Implement the selected risk control measures and verify their effectiveness.',
        fields: [
          { id: 'implementation_summary', label: 'Implemented risk control measures', type: 'richtext', helpText: 'List all risk control measures implemented with evidence of implementation (design changes, test results, labelling updates).' },
          { id: 'verification_evidence', label: 'Verification of effectiveness', type: 'richtext', helpText: 'Describe how each risk control measure was verified to be effective (testing, inspection, analysis).' },
          { id: 'verification_doc', label: 'Verification records', type: 'doc_reference', required: true, helpText: 'Link to verification test reports or records.' },
        ],
      },
    ],
  },

  '6.3': {
    clauseTitle: '6.3 — Residual Risk Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '6.3_residual',
        stepLabel: 'Residual Risk Evaluation',
        requirementText: 'Evaluate residual risk after applying risk control measures. Determine if residual risk is acceptable.',
        fields: [
          { id: 'residual_risk_eval', label: 'Residual risk evaluation', type: 'richtext', helpText: 'For each controlled risk, state the residual risk level and whether it meets acceptability criteria.' },
          { id: 'residual_acceptable', label: 'Are all residual risks acceptable?', type: 'select', options: ['Yes — all residual risks are acceptable', 'No — benefit-risk analysis required for some', 'In progress'], helpText: 'If any residual risk is not acceptable, proceed to §6.4 benefit-risk analysis.' },
        ],
      },
    ],
  },

  '6.4': {
    clauseTitle: '6.4 — Benefit-Risk Analysis',
    evidenceRequired: true,
    steps: [
      {
        id: '6.4_benefit_risk',
        stepLabel: 'Benefit-Risk Analysis',
        requirementText: 'If residual risk is not acceptable, perform benefit-risk analysis to determine if medical benefits outweigh the residual risk.',
        fields: [
          { id: 'benefit_risk_analysis', label: 'Benefit-risk analysis', type: 'richtext', helpText: 'For risks that exceed acceptability criteria, document the clinical benefits that justify acceptance of the residual risk.' },
          { id: 'benefit_risk_conclusion', label: 'Conclusion', type: 'select', options: ['Benefits outweigh residual risks', 'Risks not justified — additional controls needed', 'Not applicable — all residual risks acceptable'], helpText: 'State the final determination.' },
        ],
      },
    ],
  },

  '6.5': {
    clauseTitle: '6.5 — Risks Arising from Risk Control Measures',
    evidenceRequired: true,
    steps: [
      {
        id: '6.5_new_risks',
        stepLabel: 'New Risks from Controls',
        requirementText: 'Evaluate whether implemented risk control measures introduce new hazards or increase existing risks.',
        fields: [
          { id: 'new_hazards', label: 'New hazards or increased risks identified?', type: 'select', options: ['None identified', 'Yes — new hazards identified and controlled', 'Yes — increased risks identified and controlled'], helpText: 'If new risks were introduced, they must be fed back into the risk analysis process.' },
          { id: 'new_hazards_detail', label: 'Details of new hazards (if any)', type: 'richtext', helpText: 'Describe any new hazards introduced by risk control measures and how they were addressed.' },
        ],
      },
    ],
  },

  '6.6': {
    clauseTitle: '6.6 — Completeness of Risk Control',
    evidenceRequired: true,
    steps: [
      {
        id: '6.6_completeness',
        stepLabel: 'Completeness Verification',
        requirementText: 'Verify that all identified hazardous situations have been considered and risk control is complete.',
        fields: [
          { id: 'completeness_check', label: 'Completeness verification', type: 'richtext', helpText: 'Confirm that every hazardous situation in the risk analysis has a corresponding risk evaluation and, where needed, risk control measure.' },
          { id: 'all_addressed', label: 'All hazardous situations addressed?', type: 'select', options: ['Yes — all addressed', 'No — gaps remain'], helpText: 'This is a formal checkpoint before proceeding to overall residual risk evaluation.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Evaluation of Overall Residual Risk
  // ═══════════════════════════════════════════════════════════
  '7': {
    clauseTitle: '7 — Evaluation of Overall Residual Risk',
    evidenceRequired: true,
    steps: [
      {
        id: '7_overall',
        stepLabel: 'Overall Residual Risk',
        requirementText: 'Evaluate the overall residual risk posed by the device, considering all individual residual risks together.',
        fields: [
          { id: 'overall_evaluation', label: 'Overall residual risk evaluation', type: 'richtext', helpText: 'Consider the cumulative effect of all residual risks. Is the overall residual risk acceptable per the risk management plan?' },
          { id: 'overall_acceptable', label: 'Overall residual risk determination', type: 'select', options: ['Acceptable', 'Acceptable with benefit-risk justification', 'Not acceptable — further action required'], helpText: 'This is the final determination before the risk management review.' },
          { id: 'overall_doc', label: 'Overall residual risk documentation', type: 'doc_reference', helpText: 'Link to the overall residual risk assessment document.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §8 Risk Management Review
  // ═══════════════════════════════════════════════════════════
  '8': {
    clauseTitle: '8 — Risk Management Review',
    evidenceRequired: true,
    steps: [
      {
        id: '8_review',
        stepLabel: 'Risk Management Review',
        requirementText: 'Conduct a review ensuring the risk management plan has been executed, overall residual risk is acceptable, and post-production methods are in place.',
        fields: [
          { id: 'review_evidence', label: 'Review evidence', type: 'richtext', helpText: 'Document that the review confirmed: plan execution completeness, overall residual risk acceptability, and adequacy of post-production information collection.' },
          { id: 'review_date', label: 'Review date', type: 'text', placeholder: 'YYYY-MM-DD', helpText: 'Date the risk management review was conducted.' },
          { id: 'review_participants', label: 'Review participants', type: 'richtext', helpText: 'List the participants in the risk management review (names, roles).' },
          { id: 'review_doc', label: 'Review meeting minutes / record', type: 'doc_reference', required: true, helpText: 'Link to the risk management review record.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §9 Production and Post-Production Activities
  // ═══════════════════════════════════════════════════════════
  '9': {
    clauseTitle: '9 — Production and Post-Production Activities',
    evidenceRequired: true,
    steps: [
      {
        id: '9_post_prod',
        stepLabel: 'Post-Production Monitoring',
        requirementText: 'Establish a system to collect and review production and post-production information relevant to safety.',
        fields: [
          { id: 'ppi_system', label: 'Post-production information system', type: 'richtext', helpText: 'Describe how complaints, incidents, literature, and field data are collected and evaluated for risk relevance.' },
          { id: 'feedback_loop', label: 'Feedback to risk management', type: 'richtext', helpText: 'Explain how post-production findings trigger updates to the risk management file (new hazards, changed probabilities, etc.).' },
          { id: 'ppi_doc', label: 'PMS/PPI procedure reference', type: 'doc_reference', helpText: 'Link to the post-market surveillance or post-production information procedure.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §10 Risk Management Report
  // ═══════════════════════════════════════════════════════════
  '10': {
    clauseTitle: '10 — Risk Management Report',
    evidenceRequired: true,
    steps: [
      {
        id: '10_report',
        stepLabel: 'Risk Management Report',
        requirementText: 'Compile a risk management report summarising the results, including overall residual risk acceptability and traceability.',
        fields: [
          { id: 'report_summary', label: 'Report summary', type: 'richtext', helpText: 'High-level summary of the risk management report: number of hazards identified, risk controls implemented, residual risk status.' },
          { id: 'traceability', label: 'Traceability demonstration', type: 'richtext', helpText: 'Confirm that all hazards are traceable to risk controls and verification evidence.' },
          { id: 'report_doc', label: 'Risk management report', type: 'doc_reference', required: true, helpText: 'Link to the finalised risk management report.' },
        ],
      },
    ],
  },
};
