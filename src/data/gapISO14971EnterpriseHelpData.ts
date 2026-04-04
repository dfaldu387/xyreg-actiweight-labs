/**
 * Contextual help data for ISO 14971 Enterprise-level clauses (§3.1–3.3).
 */
import type { GapClauseHelp } from './gapAnalysisHelpData';

export const ISO_14971_ENTERPRISE_HELP: Record<string, GapClauseHelp> = {
  '3.1': {
    section: '3.1', title: 'Risk Management Process',
    overview: 'The organisation must define and document an organisation-wide risk management process that applies to all medical devices. This includes the policy for determining acceptable risk and criteria for risk acceptability.',
    expectations: [
      'Documented risk management procedure/SOP applicable across the organisation',
      'Risk acceptability criteria defined (probability × severity matrix or equivalent)',
      'ALARP principle applied and documented',
      'Process covers all lifecycle stages',
      'Regular review and update of the RM process',
    ],
    whyItMatters: 'This is the organisational foundation for risk management. Without a defined process, individual product risk management will be inconsistent and potentially non-compliant.',
    tips: [
      'Separate the organisational RM procedure from product-specific RM plans',
      'Define risk acceptability criteria that can be applied across different device classes',
      'Include both pre-market and post-market risk management activities',
      'Reference ISO/TR 24971 for implementation guidance',
    ],
    commonPitfalls: [
      'No distinction between organisational process and product-level plan',
      'Risk acceptability criteria too vague (e.g., "as low as reasonably practicable" without quantification)',
      'Process not covering post-production information feedback',
      'No periodic review of the risk management process itself',
    ],
    keyDeliverables: ['Risk management procedure', 'Risk acceptability matrix', 'Risk management policy'],
  },
  '3.2': {
    section: '3.2', title: 'Management Responsibilities',
    overview: 'Top management must demonstrate commitment to risk management by defining a risk management policy, ensuring adequate resources, and reviewing risk management activities.',
    expectations: [
      'Signed risk management policy by top management',
      'Adequate resources allocated for RM activities',
      'Regular management review of risk management performance',
      'Communication of RM requirements throughout the organisation',
    ],
    whyItMatters: 'Risk management cannot succeed without management commitment. Auditors look for tangible evidence that management is engaged, not just that a policy exists.',
    tips: [
      'Include risk management in management review agenda',
      'Budget explicitly for risk management tools and training',
      'Appoint a senior-level risk management champion',
      'Report risk management KPIs to top management',
    ],
    commonPitfalls: [
      'Policy exists but management not actively engaged',
      'No resources specifically allocated for RM',
      'Risk management not included in management review',
      'No evidence of management communication about RM',
    ],
    keyDeliverables: ['Risk management policy', 'Management review records (RM section)', 'Resource allocation evidence'],
  },
  '3.3': {
    section: '3.3', title: 'Qualification of Personnel',
    overview: 'Personnel involved in risk management must have appropriate knowledge, experience, and training. This includes knowledge of the device, risk management tools, applicable standards, and clinical/technical domains.',
    expectations: [
      'Defined competence requirements for RM roles',
      'Training program covering RM principles, tools, and standards',
      'Training records maintained for all RM personnel',
      'Evidence of competence evaluation',
    ],
    whyItMatters: 'Unqualified risk management personnel produce incomplete or inaccurate risk analyses. This is a significant finding in regulatory audits.',
    tips: [
      'Define competence requirements per role (facilitator, analyst, reviewer)',
      'Include device domain knowledge, not just generic RM training',
      'Use practical exercises in RM training (real hazard analysis examples)',
      'Maintain a competence matrix for the RM team',
    ],
    commonPitfalls: [
      'Generic RM training without device-specific knowledge',
      'No competence requirements defined for RM roles',
      'Training records incomplete or missing',
      'No competence evaluation (training attendance ≠ competence)',
    ],
    keyDeliverables: ['RM competence requirements', 'Training records', 'Competence matrix'],
  },
};
