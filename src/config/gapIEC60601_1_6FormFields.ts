/**
 * IEC 60601-1-6 (Usability) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for usability of ME equipment (§4–5).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const IEC_60601_1_6_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §4 General Requirements
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Application of Usability Engineering Process',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_process',
        stepLabel: 'Usability Engineering Process',
        requirementText: 'Demonstrate that a usability engineering process per IEC 62366-1 is applied throughout the device lifecycle.',
        fields: [
          { id: 'ue_process_description', label: 'Usability engineering process description', type: 'richtext', helpText: 'Describe how the usability engineering process per IEC 62366-1 is applied. Reference your UE plan.' },
          { id: 'ue_plan_ref', label: 'Usability engineering plan', type: 'doc_reference', required: true, helpText: 'Link to the usability engineering plan document.' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Usability Engineering File',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_file',
        stepLabel: 'Usability Engineering File',
        requirementText: 'Maintain a usability engineering file containing all records and documents produced by the usability engineering process.',
        fields: [
          { id: 'ue_file_contents', label: 'Usability engineering file contents', type: 'richtext', helpText: 'Describe the structure and contents of the usability engineering file. List key documents included.' },
          { id: 'ue_file_ref', label: 'Usability engineering file reference', type: 'doc_reference', required: true, helpText: 'Link to the usability engineering file or its index.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Usability Engineering Process
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — Prepare USE Specification',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_use_spec',
        stepLabel: 'Use Specification',
        requirementText: 'Define the use specification: intended medical indication, patient population, intended users, use environment, and operating principle.',
        fields: [
          { id: 'medical_indication', label: 'Intended medical indication and patient population', type: 'richtext', helpText: 'Describe the medical conditions addressed and the target patient population.' },
          { id: 'user_profile', label: 'Intended user profile', type: 'richtext', helpText: 'Describe intended users: training, experience, language, physical/cognitive capabilities.' },
          { id: 'use_environment', label: 'Intended use environment', type: 'richtext', helpText: 'Describe the physical environment: lighting, noise, workspace, hygiene requirements.' },
          { id: 'operating_principle', label: 'Operating principle', type: 'richtext', helpText: 'Describe the fundamental operating principle of the device.' },
          { id: 'use_spec_ref', label: 'Use specification document', type: 'doc_reference', helpText: 'Link to the formal use specification document.' },
        ],
      },
    ],
  },

  '5.2': {
    clauseTitle: '5.2 — Identify User Interface Characteristics Related to Safety',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_hazards',
        stepLabel: 'Safety-Related UI Characteristics',
        requirementText: 'Analyse the user interface to identify characteristics that could lead to use errors and hazardous situations.',
        fields: [
          { id: 'ui_hazards', label: 'Known or foreseeable hazards', type: 'richtext', helpText: 'List UI-related hazards and hazardous situations identified through analysis.' },
          { id: 'use_scenarios', label: 'Hazard-related use scenarios', type: 'richtext', helpText: 'Describe scenarios where UI characteristics could lead to use errors causing harm.' },
          { id: 'hazard_analysis_ref', label: 'UI hazard analysis reference', type: 'doc_reference', helpText: 'Link to the UI hazard analysis or use-related risk analysis.' },
        ],
      },
    ],
  },

  '5.3': {
    clauseTitle: '5.3 — Identify Hazard-Related Use Scenarios',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_scenarios',
        stepLabel: 'Hazard-Related Use Scenarios',
        requirementText: 'Systematically identify hazard-related use scenarios that could result in harm.',
        fields: [
          { id: 'task_analysis', label: 'Task analysis and failure modes', type: 'richtext', helpText: 'Document task analyses performed and use error failure modes identified.' },
          { id: 'scenario_documentation', label: 'Hazard-related use scenario documentation', type: 'richtext', helpText: 'Describe each hazard-related use scenario including the sequence of events leading to harm.' },
          { id: 'scenarios_ref', label: 'Use scenario documentation', type: 'doc_reference', helpText: 'Link to the hazard-related use scenario documentation.' },
        ],
      },
    ],
  },

  '5.4': {
    clauseTitle: '5.4 — Select Hazard-Related Use Scenarios for Summative Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '5.4_selection',
        stepLabel: 'Scenario Selection for Summative Testing',
        requirementText: 'Select the critical hazard-related use scenarios that must be evaluated during summative usability testing.',
        fields: [
          { id: 'selection_criteria', label: 'Selection criteria and rationale', type: 'richtext', helpText: 'Describe the criteria used to select scenarios for summative evaluation (e.g., severity of harm, probability of use error).' },
          { id: 'selected_scenarios', label: 'Selected scenarios', type: 'richtext', helpText: 'List the hazard-related use scenarios selected for summative evaluation with justification.' },
        ],
      },
    ],
  },

  '5.5': {
    clauseTitle: '5.5 — Establish User Interface Specification',
    evidenceRequired: true,
    steps: [
      {
        id: '5.5_ui_spec',
        stepLabel: 'UI Specification',
        requirementText: 'Define user interface requirements addressing identified hazards and use errors.',
        fields: [
          { id: 'ui_requirements', label: 'User interface requirements', type: 'richtext', helpText: 'List UI requirements for displays, controls, alarms, and labelling that address identified hazards.' },
          { id: 'ui_spec_ref', label: 'UI specification document', type: 'doc_reference', helpText: 'Link to the user interface specification.' },
        ],
      },
    ],
  },

  '5.6': {
    clauseTitle: '5.6 — Establish User Interface Evaluation Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '5.6_eval_plan',
        stepLabel: 'Evaluation Plan',
        requirementText: 'Create a plan for evaluating the user interface through formative and summative methods.',
        fields: [
          { id: 'evaluation_methods', label: 'Evaluation methods', type: 'richtext', helpText: 'Describe formative and summative evaluation methods planned (expert reviews, cognitive walkthroughs, usability tests).' },
          { id: 'acceptance_criteria', label: 'Acceptance criteria', type: 'richtext', helpText: 'Define acceptance criteria for the summative evaluation.' },
          { id: 'eval_plan_ref', label: 'UI evaluation plan document', type: 'doc_reference', helpText: 'Link to the UI evaluation plan.' },
        ],
      },
    ],
  },

  '5.7': {
    clauseTitle: '5.7 — UI Design, Implementation and Formative Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '5.7_design',
        stepLabel: 'UI Design & Implementation',
        requirementText: 'Design and implement the user interface.',
        fields: [
          { id: 'design_description', label: 'UI design description', type: 'richtext', helpText: 'Describe the UI design including key design decisions and how they address identified hazards.' },
        ],
      },
      {
        id: '5.7_formative',
        stepLabel: 'Formative Evaluation',
        requirementText: 'Conduct formative evaluations to identify and fix usability issues.',
        fields: [
          { id: 'formative_methods', label: 'Formative evaluation methods used', type: 'richtext', helpText: 'Describe formative methods applied: expert reviews, cognitive walkthroughs, early user tests, heuristic evaluations.' },
          { id: 'formative_results', label: 'Formative evaluation results', type: 'richtext', helpText: 'Summarise findings from formative evaluations and design changes made as a result.' },
          { id: 'formative_ref', label: 'Formative evaluation report', type: 'doc_reference', helpText: 'Link to formative evaluation report(s).' },
        ],
      },
    ],
  },

  '5.8': {
    clauseTitle: '5.8 — Summative Evaluation of Usability',
    evidenceRequired: true,
    steps: [
      {
        id: '5.8_plan',
        stepLabel: 'Summative Test Plan',
        requirementText: 'Develop the summative usability test plan.',
        fields: [
          { id: 'test_plan_description', label: 'Summative test plan description', type: 'richtext', helpText: 'Describe the summative test plan: participant recruitment, tasks, success criteria, test environment.' },
          { id: 'test_plan_ref', label: 'Summative test plan document', type: 'doc_reference', required: true, helpText: 'Link to the summative usability test plan.' },
        ],
      },
      {
        id: '5.8_results',
        stepLabel: 'Summative Test Results',
        requirementText: 'Document summative usability test results.',
        fields: [
          { id: 'test_results', label: 'Summative test results', type: 'richtext', helpText: 'Summarise results: task completion rates, use errors observed, critical failures, and overall conclusions.' },
          { id: 'residual_risks', label: 'Residual use-related risks', type: 'richtext', helpText: 'Document any residual use-related risks and their acceptability determination.' },
          { id: 'results_ref', label: 'Summative test report', type: 'doc_reference', required: true, helpText: 'Link to the summative usability test report.' },
        ],
      },
    ],
  },

  '5.9': {
    clauseTitle: '5.9 — User Interface for Self-Use ME Equipment',
    evidenceRequired: true,
    steps: [
      {
        id: '5.9_self_use',
        stepLabel: 'Self-Use Requirements',
        requirementText: 'For self-use ME equipment, apply additional requirements for lay user interfaces.',
        fields: [
          { id: 'lay_user_interface', label: 'Lay user interface considerations', type: 'richtext', helpText: 'Describe how the UI is designed for lay users: simplified controls, clear labelling, error prevention.' },
          { id: 'training_requirements', label: 'Training for self-use', type: 'richtext', helpText: 'Describe training materials or instructions provided to lay users for safe device operation.' },
          { id: 'self_use_ref', label: 'Self-use usability documentation', type: 'doc_reference', helpText: 'Link to self-use usability documentation.' },
        ],
      },
    ],
  },
};
