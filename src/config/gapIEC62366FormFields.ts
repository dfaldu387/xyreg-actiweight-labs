/**
 * IEC 62366-1 Usability Engineering — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for usability engineering process.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const IEC_62366_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §4 Usability Engineering Process
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Usability Engineering Process',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_process',
        stepLabel: 'Usability Engineering Process',
        requirementText: 'Establish, document, and maintain a usability engineering process that is applied throughout the medical device lifecycle.',
        fields: [
          { id: 'ue_process', label: 'Usability engineering process description', type: 'richtext', helpText: 'Describe your usability engineering process: how it integrates with design and development, risk management, and the overall device lifecycle.' },
          { id: 'ue_plan_ref', label: 'Usability engineering plan', type: 'doc_reference', required: true, helpText: 'Link to the usability engineering plan (UE Plan) for this device.' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Use Specification',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_use_spec',
        stepLabel: 'Use Specification',
        requirementText: 'Document the intended medical indication, patient population, intended user profile, use environment, and operating principle.',
        fields: [
          { id: 'medical_indication', label: 'Intended medical indication', type: 'richtext', helpText: 'Describe the medical condition(s) the device is intended to diagnose, treat, or monitor.' },
          { id: 'patient_population', label: 'Patient population', type: 'richtext', helpText: 'Define the target patient population (age, condition, limitations).' },
          { id: 'user_profile', label: 'Intended user profile', type: 'richtext', helpText: 'Describe the intended users: training level, experience, physical/cognitive capabilities, language.' },
          { id: 'use_environment', label: 'Use environment', type: 'richtext', helpText: 'Describe where the device will be used (hospital, clinic, home, ambulance, etc.) and relevant environmental factors (lighting, noise, stress).' },
          { id: 'operating_principle', label: 'Operating principle', type: 'richtext', helpText: 'Briefly describe how the user interacts with the device and its operating principle.' },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — User Interface Characteristics Related to Safety',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_ui_safety',
        stepLabel: 'Safety-Related UI Characteristics',
        requirementText: 'Identify characteristics of the user interface that could impact safety and potential use errors.',
        fields: [
          { id: 'ui_characteristics', label: 'Safety-related UI characteristics identified', type: 'richtext', helpText: 'List all user interface elements that could impact safety: displays, controls, alarms, labels, physical layout, software screens, connectors.' },
          { id: 'potential_use_errors', label: 'Potential use errors identified', type: 'richtext', helpText: 'For each UI characteristic, identify potential use errors (perception, cognition, action errors).' },
        ],
      },
    ],
  },

  '4.4': {
    clauseTitle: '4.4 — Known/Foreseeable Hazards and Hazardous Situations',
    evidenceRequired: true,
    steps: [
      {
        id: '4.4_hazards',
        stepLabel: 'Use-Related Hazards',
        requirementText: 'Identify known and foreseeable hazards and hazardous situations related to use of the device.',
        fields: [
          { id: 'use_hazards', label: 'Use-related hazards', type: 'richtext', helpText: 'List all known and foreseeable hazards arising from use of the device, including hazards from use errors, abnormal use, and foreseeable misuse.' },
          { id: 'hazard_link_to_rm', label: 'Link to risk management', type: 'richtext', helpText: 'Describe how these use-related hazards feed into the ISO 14971 risk management process.' },
          { id: 'hazard_doc', label: 'Use-related hazard analysis', type: 'doc_reference', helpText: 'Link to the use-related hazard analysis or use-FMEA.' },
        ],
      },
    ],
  },

  '4.5': {
    clauseTitle: '4.5 — Hazard-Related Use Scenarios',
    evidenceRequired: true,
    steps: [
      {
        id: '4.5_scenarios',
        stepLabel: 'Hazard-Related Use Scenarios',
        requirementText: 'Identify hazard-related use scenarios including use errors and abnormal use that could lead to harm.',
        fields: [
          { id: 'use_scenarios', label: 'Hazard-related use scenarios', type: 'richtext', helpText: 'Describe specific use scenarios where use errors or abnormal use could lead to a hazardous situation and potential harm. Include the sequence of events.' },
          { id: 'severity_assessment', label: 'Severity of potential harm', type: 'richtext', helpText: 'For each scenario, assess the severity of the potential harm to the patient, user, or third party.' },
        ],
      },
    ],
  },

  '4.6': {
    clauseTitle: '4.6 — Selection for Summative Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '4.6_selection',
        stepLabel: 'Summative Evaluation Scope',
        requirementText: 'Select which hazard-related use scenarios will be included in the summative (validation) evaluation testing.',
        fields: [
          { id: 'selected_scenarios', label: 'Scenarios selected for summative evaluation', type: 'richtext', helpText: 'List the hazard-related use scenarios selected for summative evaluation. Justify the selection — prioritise based on severity and probability.' },
          { id: 'selection_rationale', label: 'Selection rationale', type: 'richtext', helpText: 'Explain the rationale for selecting these scenarios and excluding others (if any).' },
        ],
      },
    ],
  },

  '4.7': {
    clauseTitle: '4.7 — User Interface Specification',
    evidenceRequired: true,
    steps: [
      {
        id: '4.7_ui_spec',
        stepLabel: 'UI Specification',
        requirementText: 'Establish the user interface specification including measurable usability criteria for safety-related aspects.',
        fields: [
          { id: 'ui_spec', label: 'User interface specification', type: 'richtext', helpText: 'Describe the user interface specification: layout, controls, displays, alarms, labelling, and interaction patterns.' },
          { id: 'usability_criteria', label: 'Measurable usability criteria', type: 'richtext', helpText: 'Define measurable criteria for safety-related usability aspects (e.g. task completion rate >95%, critical error rate <1%).' },
          { id: 'ui_spec_doc', label: 'UI specification document', type: 'doc_reference', helpText: 'Link to the user interface specification document.' },
        ],
      },
    ],
  },

  '4.8': {
    clauseTitle: '4.8 — UI Design and Implementation',
    evidenceRequired: true,
    steps: [
      {
        id: '4.8_design',
        stepLabel: 'UI Design & Implementation',
        requirementText: 'Design and implement the user interface considering human factors principles and risk control measures.',
        fields: [
          { id: 'design_principles', label: 'Human factors principles applied', type: 'richtext', helpText: 'Describe which human factors and ergonomic principles were applied in the UI design (consistency, feedback, error prevention, visibility).' },
          { id: 'risk_controls_ui', label: 'UI risk control measures', type: 'richtext', helpText: 'List specific UI design decisions made to mitigate use-related risks (e.g. confirmation dialogs, colour coding, physical guards).' },
        ],
      },
    ],
  },

  '4.9': {
    clauseTitle: '4.9 — UI Evaluation Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '4.9_eval_plan',
        stepLabel: 'Evaluation Planning',
        requirementText: 'Plan formative and summative evaluations including objectives, methods, participants, and acceptance criteria.',
        fields: [
          { id: 'formative_plan', label: 'Formative evaluation plan', type: 'richtext', helpText: 'Describe planned formative evaluations: timing, methods (expert review, cognitive walkthrough, simulated use), participant criteria.' },
          { id: 'summative_plan', label: 'Summative evaluation plan', type: 'richtext', helpText: 'Describe the summative evaluation plan: test protocol, sample size, user groups, use scenarios, and pass/fail criteria.' },
          { id: 'eval_plan_doc', label: 'Evaluation plan document', type: 'doc_reference', required: true, helpText: 'Link to the usability evaluation plan.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Formative Evaluation
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — Formative Evaluation — General',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_formative',
        stepLabel: 'Formative Evaluations Conducted',
        requirementText: 'Conduct formative evaluations during development to identify usability issues and inform design improvements.',
        fields: [
          { id: 'evaluations_conducted', label: 'Formative evaluations conducted', type: 'richtext', helpText: 'List all formative evaluations conducted, including timing in the development process and key objectives.' },
          { id: 'issues_identified', label: 'Usability issues identified', type: 'richtext', helpText: 'Summarise key usability issues discovered during formative evaluations.' },
          { id: 'design_changes', label: 'Design changes resulting from evaluations', type: 'richtext', helpText: 'Describe design improvements made as a result of formative evaluation findings.' },
        ],
      },
    ],
  },

  '5.2': {
    clauseTitle: '5.2 — Formative Evaluation Methods',
    evidenceRequired: true,
    steps: [
      {
        id: '5.2_methods',
        stepLabel: 'Methods Used',
        requirementText: 'Select and apply appropriate formative evaluation methods.',
        fields: [
          { id: 'methods_used', label: 'Formative evaluation methods', type: 'richtext', helpText: 'Describe the methods used: expert/heuristic review, cognitive walkthrough, simulated use testing, think-aloud protocol, interviews, etc.' },
          { id: 'method_rationale', label: 'Method selection rationale', type: 'richtext', helpText: 'Justify why the selected methods were appropriate for the stage of development and the usability questions being addressed.' },
        ],
      },
    ],
  },

  '5.3': {
    clauseTitle: '5.3 — Formative Evaluation Documentation',
    evidenceRequired: true,
    steps: [
      {
        id: '5.3_documentation',
        stepLabel: 'Evaluation Documentation',
        requirementText: 'Document formative evaluation results, identified usability issues, and design changes implemented.',
        fields: [
          { id: 'evaluation_reports', label: 'Formative evaluation reports', type: 'richtext', helpText: 'Summarise the content of formative evaluation reports: findings, severity ratings, recommendations.' },
          { id: 'formative_doc', label: 'Formative evaluation reports', type: 'doc_reference', required: true, helpText: 'Link to formative evaluation reports.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5.7–5.9 Summative Evaluation
  // ═══════════════════════════════════════════════════════════
  '5.7': {
    clauseTitle: '5.7 — Summative Evaluation Planning',
    evidenceRequired: true,
    steps: [
      {
        id: '5.7_planning',
        stepLabel: 'Summative Protocol',
        requirementText: 'Plan summative evaluation including test protocol, sample size, user groups, and pass/fail criteria.',
        fields: [
          { id: 'test_protocol', label: 'Test protocol summary', type: 'richtext', helpText: 'Describe the summative test protocol: study design, use scenarios to be tested, simulated use environment setup.' },
          { id: 'sample_size', label: 'Sample size and user groups', type: 'richtext', helpText: 'Describe participant recruitment: number of users per group, group definitions, inclusion/exclusion criteria. Justify sample size (typically ≥15 per user group per FDA guidance).' },
          { id: 'pass_fail', label: 'Pass/fail criteria', type: 'richtext', helpText: 'Define the acceptance criteria: what constitutes a pass or fail for each use scenario (e.g. no critical use errors, task completion >95%).' },
          { id: 'protocol_doc', label: 'Summative evaluation protocol', type: 'doc_reference', required: true, helpText: 'Link to the summative evaluation protocol.' },
        ],
      },
    ],
  },

  '5.8': {
    clauseTitle: '5.8 — Summative Evaluation Execution',
    evidenceRequired: true,
    steps: [
      {
        id: '5.8_execution',
        stepLabel: 'Test Execution',
        requirementText: 'Execute summative evaluation with representative users performing critical tasks in simulated use environments.',
        fields: [
          { id: 'execution_summary', label: 'Execution summary', type: 'richtext', helpText: 'Describe how the summative evaluation was conducted: dates, location, facilitators, any deviations from the protocol.' },
          { id: 'participants', label: 'Participant demographics', type: 'richtext', helpText: 'Summarise participant demographics and confirm they represent the intended user population.' },
          { id: 'use_errors_observed', label: 'Use errors and difficulties observed', type: 'richtext', helpText: 'List all use errors, close calls, and difficulties observed during testing, with severity ratings.' },
        ],
      },
    ],
  },

  '5.9': {
    clauseTitle: '5.9 — Summative Evaluation Results and Report',
    evidenceRequired: true,
    steps: [
      {
        id: '5.9_results',
        stepLabel: 'Results & Conclusions',
        requirementText: 'Document results, analyse findings, and determine whether the device meets the defined usability acceptance criteria.',
        fields: [
          { id: 'results_summary', label: 'Results summary', type: 'richtext', helpText: 'Summarise results: task completion rates, use error rates, close calls, and comparison against pass/fail criteria.' },
          { id: 'conclusion', label: 'Overall conclusion', type: 'select', options: ['Pass — all acceptance criteria met', 'Conditional pass — minor findings, no safety concerns', 'Fail — critical findings require design changes and re-testing'], helpText: 'State the overall conclusion of the summative evaluation.' },
          { id: 'residual_use_risks', label: 'Residual use-related risks', type: 'richtext', helpText: 'Describe any residual use-related risks identified and how they are addressed (risk management file update, IFU additions, training).' },
          { id: 'summative_report_doc', label: 'Summative evaluation report', type: 'doc_reference', required: true, helpText: 'Link to the summative (human factors validation) evaluation report.' },
        ],
      },
    ],
  },
};
