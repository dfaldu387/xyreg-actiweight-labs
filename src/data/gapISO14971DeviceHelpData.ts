/**
 * Contextual help data for ISO 14971 device-level clauses (§3.4–10).
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const ISO_14971_DEVICE_HELP: Record<string, GapClauseHelp> = {
  '3.4': {
    section: '3.4',
    title: 'Risk Management Plan',
    overview: 'The risk management plan is the foundation document for all risk management activities for a specific device. It defines scope, responsibilities, acceptability criteria, verification activities, and how post-production information will be handled.',
    expectations: [
      'A documented, device-specific risk management plan (not just a generic company procedure)',
      'Clear risk acceptability criteria (e.g. a probability × severity matrix)',
      'Defined roles and responsibilities for risk management activities',
      'Planned verification activities for risk control measures',
      'Post-production monitoring activities defined',
    ],
    whyItMatters: 'Without a risk management plan, there is no structured basis for risk management. Auditors check this first — if the plan is missing or incomplete, the entire risk management process is undermined.',
    tips: [
      'Use the risk management plan template from ISO/TR 24971 as a starting point',
      'Ensure the plan is device-specific, not just a copy of the company-level procedure',
      'Define the risk acceptability matrix before starting risk analysis',
      'Include a clear statement of the intended use in the plan',
    ],
    commonPitfalls: [
      'Using a generic company-level plan without device-specific details',
      'Missing or vague risk acceptability criteria',
      'No link to post-production information collection',
      'Plan not updated when the device design changes significantly',
    ],
    keyDeliverables: ['Risk management plan', 'Risk acceptability matrix', 'Roles & responsibilities matrix'],
  },

  '3.5': {
    section: '3.5',
    title: 'Risk Management File',
    overview: 'The risk management file is the collection of all records and documents produced by the risk management process. It provides traceability from hazard identification through risk control to residual risk acceptance.',
    expectations: [
      'A structured file (physical or electronic) containing or referencing all risk management records',
      'Table of contents or index showing all included documents',
      'Evidence of version control and document management',
    ],
    whyItMatters: 'The risk management file is what auditors and regulators review. If documents cannot be found or traced, compliance cannot be demonstrated.',
    tips: [
      'Maintain an index/table of contents for the file',
      'Use cross-references rather than duplicating documents',
      'Ensure the file is kept up to date throughout the product lifecycle',
    ],
    commonPitfalls: [
      'File exists but is incomplete or out of date',
      'No version control on risk management documents',
      'Documents scattered across systems with no central index',
    ],
    keyDeliverables: ['Risk management file index', 'Complete risk management file'],
  },

  '4.1': {
    section: '4.1',
    title: 'Risk Analysis Process',
    overview: 'Risk analysis involves systematically using available information to identify hazards and estimate risks. This clause requires defining the intended use, identifying hazards associated with the device, and estimating the risk for each hazardous situation.',
    expectations: [
      'Documented risk analysis methodology (FMEA, FTA, HAZOP, or combination)',
      'Systematic coverage of all device characteristics that could affect safety',
      'Risk estimation for each identified hazardous situation',
    ],
    whyItMatters: 'Risk analysis is the core technical activity. Incomplete or unsystematic analysis leads to missed hazards and uncontrolled risks.',
    tips: [
      'Use multiple analysis techniques for comprehensive coverage',
      'Include both normal use and fault conditions',
      'Consider the full lifecycle including transport, installation, use, maintenance, and disposal',
    ],
    commonPitfalls: [
      'Only analysing obvious hazards without systematic methodology',
      'Skipping fault condition analysis',
      'Not considering the full lifecycle',
    ],
    keyDeliverables: ['Risk analysis report', 'FMEA/FTA worksheets'],
  },

  '4.2': {
    section: '4.2',
    title: 'Intended Use and Reasonably Foreseeable Misuse',
    overview: 'Before hazards can be identified, the intended use must be precisely defined. This includes the medical indication, patient population, intended user, use environment, and operating principle. Reasonably foreseeable misuse must also be considered.',
    expectations: [
      'Clear, unambiguous intended use statement',
      'Intended user profile (professional, lay user, patient)',
      'Patient population (age, condition, contraindications)',
      'Use environment (hospital, home, ambulance, etc.)',
      'Documented reasonably foreseeable misuse scenarios',
    ],
    whyItMatters: 'The intended use drives the entire risk analysis. If it is unclear or too narrow, hazards will be missed. Foreseeable misuse must be addressed to avoid liability gaps.',
    tips: [
      'Align the intended use statement with your IFU and regulatory submissions',
      'Consider off-label use patterns reported in literature or complaints',
      'Involve clinical users in identifying misuse scenarios',
    ],
    commonPitfalls: [
      'Intended use statement too vague or too restrictive',
      'Ignoring reasonably foreseeable misuse',
      'Inconsistency between intended use in risk file vs. IFU vs. regulatory submission',
    ],
    keyDeliverables: ['Intended use statement', 'Foreseeable misuse analysis'],
  },

  '4.3': {
    section: '4.3',
    title: 'Identification of Safety Characteristics',
    overview: 'Using ISO 14971 Annex C as a guide, identify all device characteristics that could affect safety. This systematic review ensures no safety-relevant aspect is overlooked.',
    expectations: [
      'Documented review against ISO 14971 Annex C questions',
      'Justification for characteristics deemed not applicable',
      'Link between identified characteristics and subsequent hazard analysis',
    ],
    whyItMatters: 'Annex C provides a comprehensive checklist. Skipping this step often leads to gaps in hazard identification.',
    tips: [
      'Go through every Annex C question even if the answer seems obvious',
      'Document "not applicable" with rationale rather than leaving blank',
      'Use this as input to the hazard identification step (§4.4)',
    ],
    commonPitfalls: [
      'Superficial review of Annex C without detailed consideration',
      'Not linking characteristics to hazards',
      'Missing characteristics related to accessories or connected devices',
    ],
    keyDeliverables: ['Annex C review checklist', 'Safety characteristics list'],
  },

  '4.4': {
    section: '4.4',
    title: 'Identification of Hazards and Hazardous Situations',
    overview: 'Systematically identify all known and foreseeable hazards associated with the device in both normal use and fault conditions. For each hazard, identify the hazardous situations that could arise.',
    expectations: [
      'Comprehensive hazard list covering all hazard types (energy, biological, chemical, etc.)',
      'Hazardous situations identified for both normal and fault conditions',
      'Consideration of initiating events and sequences of events',
    ],
    whyItMatters: 'This is the most critical step — any hazard missed here will not have a risk control measure, creating a gap in patient safety.',
    tips: [
      'Use structured techniques (FMEA, HAZOP) rather than brainstorming alone',
      'Include use errors (refer to IEC 62366-1 usability analysis)',
      'Consider interactions with other devices and the clinical environment',
    ],
    commonPitfalls: [
      'Listing only device failures without considering use errors',
      'Not considering fault conditions',
      'Conflating hazards with hazardous situations (they are different concepts)',
    ],
    keyDeliverables: ['Hazard identification table', 'Hazardous situation analysis'],
  },

  '4.5': {
    section: '4.5',
    title: 'Risk Estimation',
    overview: 'For each identified hazardous situation, estimate the risk by determining the probability of occurrence of harm and the severity of that harm.',
    expectations: [
      'Defined probability and severity scales',
      'Documented risk estimation for each hazardous situation',
      'Rationale for probability estimates (data, literature, expert judgement)',
    ],
    whyItMatters: 'Risk estimation is the basis for risk evaluation. If estimates are arbitrary or unjustified, the entire risk management process loses credibility.',
    tips: [
      'Use clinical data, literature, and complaint data to support probability estimates',
      'Be conservative with estimates when data is limited',
      'Document the rationale for each estimate',
    ],
    commonPitfalls: [
      'Using probability of the hazardous situation instead of probability of harm',
      'No rationale for probability estimates',
      'Inconsistent application of severity scale across hazards',
    ],
    keyDeliverables: ['Risk estimation table', 'Probability/severity rationale'],
  },

  '5': {
    section: '5',
    title: 'Risk Evaluation',
    overview: 'Compare each estimated risk against the acceptability criteria defined in the risk management plan. Determine which risks are acceptable, which require risk control, and which need benefit-risk analysis.',
    expectations: [
      'Each risk evaluated against the risk acceptability matrix',
      'Clear determination for each risk: acceptable, ALARP, or unacceptable',
      'List of risks requiring risk control measures',
    ],
    whyItMatters: 'Risk evaluation determines which risks must be actively controlled. Without it, there is no structured basis for deciding where to invest in risk reduction.',
    tips: [
      'Apply the criteria consistently across all risks',
      'Document the evaluation for every hazardous situation, not just unacceptable ones',
      'Review the matrix with a cross-functional team',
    ],
    commonPitfalls: [
      'Inconsistent application of acceptability criteria',
      'Not documenting acceptable risks',
      'Changing acceptability criteria mid-analysis without justification',
    ],
    keyDeliverables: ['Risk evaluation results', 'Risk matrix (populated)'],
  },

  '6.1': {
    section: '6.1',
    title: 'Risk Control Option Analysis',
    overview: 'For each risk that requires control, analyse options following the priority hierarchy: (1) inherent safety by design, (2) protective measures, (3) information for safety.',
    expectations: [
      'Documented analysis of control options for each unacceptable risk',
      'Evidence that the priority order was followed',
      'Justification if a lower-priority measure was selected over a higher one',
    ],
    whyItMatters: 'The priority order is a legal requirement under ISO 14971 and MDR. Auditors specifically check that manufacturers did not skip straight to labelling warnings without considering design changes.',
    tips: [
      'Always consider inherent safety by design first, even if it seems impractical',
      'Document why higher-priority options were not feasible',
      'Consider combinations of measures for complex risks',
    ],
    commonPitfalls: [
      'Defaulting to "information for safety" (IFU warnings) without considering design changes',
      'No documentation of options considered and rejected',
      'Not considering the priority hierarchy at all',
    ],
    keyDeliverables: ['Risk control option analysis', 'Priority justification'],
  },

  '6.2': {
    section: '6.2',
    title: 'Implementation of Risk Control Measures',
    overview: 'Implement the selected risk control measures and verify that each measure is effective in reducing the risk as intended.',
    expectations: [
      'Evidence of implementation (design documents, process changes, labelling updates)',
      'Verification records demonstrating effectiveness of each measure',
      'Traceability from risk to control measure to verification',
    ],
    whyItMatters: 'Implementation without verification is incomplete. Auditors require objective evidence that risk controls actually work.',
    tips: [
      'Define verification criteria before implementing controls',
      'Use test reports, inspection records, or analysis as verification evidence',
      'Ensure traceability: hazard → risk → control → verification',
    ],
    commonPitfalls: [
      'Controls implemented but not verified',
      'Verification criteria not defined upfront',
      'No traceability between risk and control',
    ],
    keyDeliverables: ['Implementation records', 'Verification test reports', 'Traceability matrix'],
  },

  '6.3': {
    section: '6.3',
    title: 'Residual Risk Evaluation',
    overview: 'After applying risk control measures, evaluate the residual risk. If residual risk is not acceptable, either apply additional controls or proceed to benefit-risk analysis (§6.4).',
    expectations: [
      'Residual risk level documented for each controlled risk',
      'Comparison against acceptability criteria',
      'Decision on each residual risk: acceptable, needs further control, or needs benefit-risk analysis',
    ],
    whyItMatters: 'Residual risk evaluation closes the loop. It confirms that controls actually reduced risk to an acceptable level.',
    tips: [
      'Re-estimate probability and severity after controls are in place',
      'Do not simply mark all residual risks as "acceptable" without justification',
      'Consider the effectiveness of each control measure',
    ],
    commonPitfalls: [
      'Assuming controls always reduce risk to acceptable levels without re-evaluation',
      'Not re-estimating probability after applying controls',
      'Missing the link to benefit-risk analysis for residual risks that remain unacceptable',
    ],
    keyDeliverables: ['Residual risk evaluation table', 'Updated risk matrix'],
  },

  '6.4': {
    section: '6.4',
    title: 'Benefit-Risk Analysis',
    overview: 'When residual risk is not acceptable and no further risk control measures are practicable, determine whether the medical benefits outweigh the residual risk.',
    expectations: [
      'Documented benefit-risk analysis for each risk exceeding acceptability criteria',
      'Clinical benefits clearly stated and supported by evidence',
      'Explicit conclusion: benefits outweigh risk, or not',
    ],
    whyItMatters: 'This is the last resort for risks that cannot be reduced further. The analysis must be robust enough to withstand regulatory scrutiny.',
    tips: [
      'Support clinical benefits with clinical evidence or literature',
      'Consider the state of the art — are competitors achieving better risk levels?',
      'Get clinical input for the benefit assessment',
    ],
    commonPitfalls: [
      'Benefit-risk analysis used too liberally instead of implementing controls',
      'Benefits stated without supporting evidence',
      'Not considering the state of the art in comparable devices',
    ],
    keyDeliverables: ['Benefit-risk analysis', 'Clinical benefit evidence'],
  },

  '6.5': {
    section: '6.5',
    title: 'Risks Arising from Risk Control Measures',
    overview: 'Evaluate whether implemented risk control measures introduce new hazards or hazardous situations, or increase risks from existing hazardous situations.',
    expectations: [
      'Documented evaluation for each risk control measure',
      'Any new hazards fed back into the risk analysis process',
      'Evidence that the net effect of controls is positive',
    ],
    whyItMatters: 'Risk controls can inadvertently create new risks. Without this check, the risk profile could actually worsen.',
    tips: [
      'Review each control measure with cross-functional input',
      'Consider how controls interact with each other',
      'If new hazards are found, run them through the full risk process (§4.4–6.3)',
    ],
    commonPitfalls: [
      'Rubber-stamping "no new risks" without genuine analysis',
      'Not considering interactions between multiple controls',
      'New hazards identified but not fully analysed',
    ],
    keyDeliverables: ['Risk control side-effects analysis'],
  },

  '6.6': {
    section: '6.6',
    title: 'Completeness of Risk Control',
    overview: 'Verify that all identified hazardous situations have been considered and that risk control activities are complete before proceeding to overall residual risk evaluation.',
    expectations: [
      'Formal verification that every hazardous situation has been evaluated',
      'No gaps between hazard identification and risk control',
      'Sign-off or approval that risk control is complete',
    ],
    whyItMatters: 'This is a gate check. Without it, hazards can slip through without risk controls.',
    tips: [
      'Use a traceability matrix to verify coverage',
      'Have an independent reviewer check for completeness',
      'This is a good checkpoint for a design review',
    ],
    commonPitfalls: [
      'Skipping this step and going straight to the report',
      'Incomplete traceability — some hazards not linked to evaluations',
    ],
    keyDeliverables: ['Completeness verification checklist', 'Traceability matrix'],
  },

  '7': {
    section: '7',
    title: 'Evaluation of Overall Residual Risk',
    overview: 'Evaluate the overall residual risk posed by the device, taking into account all individual residual risks in aggregate. This is different from evaluating each risk individually.',
    expectations: [
      'Documented overall residual risk evaluation',
      'Consideration of cumulative and combined effects',
      'Acceptability determination with rationale',
    ],
    whyItMatters: 'Individual risks may each be acceptable, but their combination could be unacceptable. This holistic view is often missed.',
    tips: [
      'Consider whether multiple minor risks could combine to create a significant overall concern',
      'Review post-market data from similar devices for aggregate risk insights',
      'Document the methodology for aggregating individual risks',
    ],
    commonPitfalls: [
      'Simply stating "all individual risks are acceptable, therefore overall risk is acceptable"',
      'Not considering cumulative effects',
      'No documented methodology for overall risk evaluation',
    ],
    keyDeliverables: ['Overall residual risk evaluation', 'Aggregate risk analysis'],
  },

  '8': {
    section: '8',
    title: 'Risk Management Review',
    overview: 'Before commercial release, conduct a formal review ensuring: the risk management plan was executed, overall residual risk is acceptable, and appropriate methods are in place for post-production information collection.',
    expectations: [
      'Formal review meeting with documented minutes',
      'Confirmation of plan execution completeness',
      'Confirmation of overall residual risk acceptability',
      'Confirmation of post-production monitoring adequacy',
    ],
    whyItMatters: 'The risk management review is a required gate before market release. It ensures all risk management activities are complete and conclusions are sound.',
    tips: [
      'Include cross-functional representation (R&D, QA, RA, clinical)',
      'Use a checklist to verify all plan elements were executed',
      'Record action items and their resolution',
    ],
    commonPitfalls: [
      'Review conducted as a formality without genuine assessment',
      'Missing participants from key functions',
      'Action items from the review not tracked to closure',
    ],
    keyDeliverables: ['Risk management review minutes', 'Review checklist'],
  },

  '9': {
    section: '9',
    title: 'Production and Post-Production Activities',
    overview: 'Establish and maintain a system to actively collect, review, and act on information from production and post-production. Relevant findings must be fed back into the risk management process.',
    expectations: [
      'Documented system for collecting post-production information',
      'Process for evaluating relevance to risk management',
      'Evidence that findings are fed back into the risk management file',
      'Link to PMS plan and PMCF plan (where applicable)',
    ],
    whyItMatters: 'Risk management does not end at market launch. Post-production data reveals real-world risks that pre-market analysis may have missed.',
    tips: [
      'Integrate with your PMS and vigilance systems',
      'Define triggers for re-opening the risk management file',
      'Periodically review complaint and incident trends',
    ],
    commonPitfalls: [
      'PMS system exists but is not connected to risk management',
      'No defined triggers for risk file updates',
      'Post-market data collected but never reviewed for risk relevance',
    ],
    keyDeliverables: ['PMS procedure', 'Post-production information review records'],
  },

  '10': {
    section: '10',
    title: 'Risk Management Report',
    overview: 'The risk management report summarises the entire risk management process for the device. It includes the overall residual risk acceptability determination and demonstrates traceability from hazards through controls to verification.',
    expectations: [
      'Comprehensive summary of the risk management process',
      'Statement on overall residual risk acceptability',
      'Traceability from hazards to controls to verification',
      'Reference to all supporting documents in the risk management file',
    ],
    whyItMatters: 'The report is the top-level summary document that regulators and notified bodies review. It must tell the complete story of how risks were managed.',
    tips: [
      'Include summary statistics (total hazards, controlled risks, residual risk levels)',
      'Ensure the report is consistent with the risk management file contents',
      'Update the report whenever the risk management file is updated',
    ],
    commonPitfalls: [
      'Report written at the end without reflecting actual process',
      'Inconsistencies between report and underlying analysis',
      'Report not updated after post-market risk file changes',
    ],
    keyDeliverables: ['Risk management report', 'Risk summary statistics'],
  },
};
