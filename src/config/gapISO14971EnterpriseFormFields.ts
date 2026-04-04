/**
 * ISO 14971 Enterprise-Level — Clause-Specific Form Field Definitions
 * Organizational risk management process (§3.1–3.3).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_14971_ENTERPRISE_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  '3.1': {
    clauseTitle: '3.1 — Risk Management Process',
    evidenceRequired: true,
    steps: [
      {
        id: '3.1_process',
        stepLabel: 'Process Definition',
        requirementText: 'Define and document the organisation-wide risk management process, including criteria for risk acceptability.',
        fields: [
          { id: 'rm_process', label: 'Risk management process description', type: 'richtext', helpText: 'Describe the organisation-wide risk management process: scope, lifecycle coverage, methods used, and how it applies across all products.' },
          { id: 'rm_procedure_ref', label: 'Risk management procedure', type: 'doc_reference', required: true, helpText: 'Link to the risk management procedure/SOP.' },
        ],
      },
      {
        id: '3.1_acceptability',
        stepLabel: 'Risk Acceptability Criteria',
        requirementText: 'Define the organisational policy for determining acceptable risk.',
        fields: [
          { id: 'acceptability_policy', label: 'Risk acceptability policy', type: 'richtext', helpText: 'Describe the risk acceptability policy: probability × severity matrix, ALARP principle, and how acceptability criteria are established for different device classes.' },
          { id: 'risk_matrix_ref', label: 'Risk acceptability matrix', type: 'doc_reference', helpText: 'Link to the organisational risk acceptability matrix.' },
        ],
      },
    ],
  },
  '3.2': {
    clauseTitle: '3.2 — Management Responsibilities',
    evidenceRequired: true,
    steps: [
      {
        id: '3.2_commitment',
        stepLabel: 'Management Commitment',
        requirementText: 'Demonstrate top management commitment to risk management: define policy, ensure adequate resources, and assign qualified personnel.',
        fields: [
          { id: 'mgmt_commitment', label: 'Management commitment to risk management', type: 'richtext', helpText: 'Describe how top management commits to risk management: policy endorsement, resource allocation, review of risk management outputs.' },
          { id: 'rm_policy_ref', label: 'Risk management policy', type: 'doc_reference', required: true, helpText: 'Link to the signed risk management policy.' },
          { id: 'resource_evidence', label: 'Resource allocation evidence', type: 'richtext', helpText: 'Describe resources allocated: trained risk management personnel, tools, time for risk management activities.' },
        ],
      },
    ],
  },
  '3.3': {
    clauseTitle: '3.3 — Qualification of Personnel',
    evidenceRequired: true,
    steps: [
      {
        id: '3.3_competence',
        stepLabel: 'Personnel Competence',
        requirementText: 'Ensure personnel performing risk management activities have required knowledge, experience, and training.',
        fields: [
          { id: 'competence_requirements', label: 'Competence requirements for RM personnel', type: 'richtext', helpText: 'Define the competence requirements: knowledge of the device, risk management principles/tools, applicable standards, and clinical/technical domain expertise.' },
          { id: 'training_program', label: 'Risk management training program', type: 'richtext', helpText: 'Describe the training program for risk management personnel: initial training, refresher training, and how competence is evaluated.' },
          { id: 'training_records_ref', label: 'Training records', type: 'doc_reference', helpText: 'Link to risk management training records or competence matrix.' },
        ],
      },
    ],
  },
};
