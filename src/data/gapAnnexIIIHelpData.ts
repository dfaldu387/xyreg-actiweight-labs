/**
 * Contextual help data for MDR Annex III (PMS / PMCF / Vigilance) clauses (§1–4).
 */

import type { GapClauseHelp } from './gapAnalysisHelpData';

export const MDR_ANNEX_III_HELP: Record<string, GapClauseHelp> = {
  '1.1': {
    section: '1.1',
    title: 'PMS Plan: Systematic Process',
    overview: 'The PMS plan must describe a systematic process to collect, record, and analyse data on device quality, performance, and safety throughout its entire lifetime.',
    expectations: [
      'A documented PMS plan specific to the device',
      'All data sources identified (complaints, literature, databases, clinical studies)',
      'Defined responsibilities and timelines for data collection and analysis',
      'Process for feeding PMS data back into risk management and clinical evaluation',
    ],
    whyItMatters: 'The PMS plan is a mandatory MDR requirement. Without it, the manufacturer cannot demonstrate ongoing safety monitoring. Notified bodies will check this early in any audit.',
    tips: [
      'Start the PMS plan early — it should be in place before market launch',
      'Include proactive data collection, not just reactive complaint handling',
      'Reference specific databases and literature search strategies',
    ],
    commonPitfalls: [
      'PMS plan is generic and not device-specific',
      'Only covers complaint handling, not proactive surveillance',
      'No defined timelines or responsibilities',
    ],
    keyDeliverables: ['PMS plan', 'Data source matrix'],
  },

  '1.2': {
    section: '1.2',
    title: 'Proactive Data Collection from Similar Devices',
    overview: 'The PMS plan must include proactive collection of data from similar devices, including literature reviews and database searches.',
    expectations: [
      'Similar/equivalent devices identified',
      'Systematic literature search strategy defined',
      'Vigilance database search strategy defined (MAUDE, BfArM, MHRA)',
      'Competitor device monitoring approach documented',
    ],
    whyItMatters: 'MDR requires learning from the broader market, not just your own device. Issues with similar devices may indicate risks for your product.',
    tips: [
      'Define clear search terms and databases for regular literature reviews',
      'Set up alerts for relevant databases',
      'Document the rationale for similar device selection',
    ],
    commonPitfalls: [
      'No systematic search strategy',
      'Similar devices not identified or justified',
      'Literature reviews not conducted at regular intervals',
    ],
    keyDeliverables: ['Similar device list', 'Literature search protocol', 'Database search strategy'],
  },

  '1.3': {
    section: '1.3',
    title: 'Investigation of Complaints and Incidents',
    overview: 'The PMS plan must cover systematic investigation of complaints, adverse events, and field safety corrective actions.',
    expectations: [
      'Complaint handling procedure documented',
      'Criteria for escalation to vigilance reporting defined',
      'Investigation methodology described',
      'FSCA tracking and effectiveness evaluation process',
    ],
    whyItMatters: 'Complaints are the primary source of post-market safety data. A robust complaint investigation process is essential for identifying emerging risks.',
    tips: [
      'Use standardised complaint categorisation for trend analysis',
      'Ensure complaint investigators are trained in root cause analysis',
      'Track time from complaint receipt to investigation completion',
    ],
    commonPitfalls: [
      'Complaints categorised inconsistently',
      'Investigation depth insufficient for serious events',
      'No feedback loop to design or manufacturing',
    ],
    keyDeliverables: ['Complaint handling SOP', 'Investigation forms/templates'],
  },

  '1.4': {
    section: '1.4',
    title: 'Trend Analysis',
    overview: 'The PMS plan must include methodology for identifying statistically significant increases in the frequency or severity of incidents or adverse events.',
    expectations: [
      'Statistical methods for trend detection defined',
      'Baseline incident rates established',
      'Trigger thresholds for escalation defined',
      'Regular trend reviews scheduled',
    ],
    whyItMatters: 'MDR Article 88 specifically requires trend reporting. A statistically significant increase must be reported even if individual events were not reportable.',
    tips: [
      'Establish baseline rates early using pre-market or initial post-market data',
      'Use control charts for ongoing monitoring',
      'Consider both frequency and severity trends',
    ],
    commonPitfalls: [
      'No baseline established for trend comparison',
      'Trend analysis not conducted at regular intervals',
      'Only analysing complaint frequency, not severity',
    ],
    keyDeliverables: ['Trend analysis procedure', 'Baseline incident rate documentation'],
  },

  '1.5': {
    section: '1.5',
    title: 'Indicators and Thresholds for Benefit-Risk Re-evaluation',
    overview: 'Define specific indicators and threshold values that trigger a formal re-evaluation of the benefit-risk ratio and potential corrective actions.',
    expectations: [
      'Measurable indicators defined',
      'Threshold values set for each indicator',
      'Escalation process when thresholds are exceeded',
      'Regular review of indicator values',
    ],
    whyItMatters: 'These indicators provide an early warning system. Without defined thresholds, significant safety signals may go undetected.',
    tips: [
      'Include leading indicators (e.g., complaint rate increases) not just lagging indicators (e.g., serious incidents)',
      'Set thresholds conservatively — it is better to investigate false alarms than miss real signals',
    ],
    commonPitfalls: [
      'Indicators too vague to be actionable',
      'Thresholds set too high, missing early signals',
      'No defined process when thresholds are exceeded',
    ],
    keyDeliverables: ['Indicator and threshold matrix', 'Escalation procedure'],
  },

  '1.6': {
    section: '1.6',
    title: 'Communication with Competent Authorities',
    overview: 'Procedures for communicating PMS findings to competent authorities and notified bodies must be documented per MDR Articles 83-86.',
    expectations: [
      'Reporting procedures for each EU member state',
      'Timelines for different report types',
      'Designated persons responsible for regulatory communication',
      'EUDAMED reporting capabilities',
    ],
    whyItMatters: 'Failure to report to competent authorities within required timelines is a serious regulatory non-compliance with potential legal consequences.',
    tips: [
      'Maintain a contact list for each competent authority',
      'Prepare report templates in advance',
      'Train staff on reporting timelines and criteria',
    ],
    commonPitfalls: [
      'Not knowing the reporting requirements for each member state',
      'No designated person for regulatory communication',
      'Missing reporting deadlines',
    ],
    keyDeliverables: ['Authority communication procedure', 'Competent authority contact list'],
  },

  '2.1': {
    section: '2.1',
    title: 'PMS Report for Class I Devices',
    overview: 'Class I device manufacturers must compile a PMS report summarising the results and conclusions of PMS data analysis.',
    expectations: [
      'PMS report covering all data sources',
      'Conclusions and rationale documented',
      'Corrective actions identified and tracked',
      'Report updated when necessary',
    ],
    whyItMatters: 'The PMS report demonstrates that the manufacturer is actively monitoring the device. It is part of the technical documentation.',
    tips: [
      'Update the PMS report whenever significant new data is available',
      'Include a clear conclusion on whether the benefit-risk ratio remains acceptable',
    ],
    commonPitfalls: [
      'Report not updated since initial market launch',
      'Missing conclusions or action items',
    ],
    keyDeliverables: ['PMS report'],
  },

  '2.2': {
    section: '2.2',
    title: 'PSUR for Class IIa, IIb, and III Devices',
    overview: 'Higher-class devices require a Periodic Safety Update Report (PSUR) including benefit-risk conclusions, PMCF findings, sales volume, and supplier contributions.',
    expectations: [
      'PSUR submitted at required frequency (annually for IIb/III, every 2 years for IIa)',
      'Benefit-risk determination with clear conclusions',
      'PMCF findings summarised',
      'Sales volume and user/patient estimates included',
      'Supplier PMS contributions documented',
    ],
    whyItMatters: 'The PSUR is a critical regulatory document reviewed by notified bodies. It is the most comprehensive periodic safety assessment required by MDR.',
    tips: [
      'Establish a PSUR preparation timeline well before the due date',
      'Coordinate with suppliers early to collect their PMS contributions',
      'Use the PSUR as an opportunity to update the clinical evaluation',
    ],
    commonPitfalls: [
      'PSUR submitted late',
      'Missing supplier PMS contributions',
      'Benefit-risk conclusion not substantiated by data',
      'Sales volume estimates not documented',
    ],
    keyDeliverables: ['PSUR', 'Benefit-risk analysis update'],
  },

  '3.1': {
    section: '3.1',
    title: 'PMCF Plan',
    overview: 'A PMCF plan must specify methods to proactively collect and evaluate clinical data throughout the device lifetime to confirm safety and performance.',
    expectations: [
      'PMCF plan with clear objectives',
      'Methods for clinical data collection defined',
      'Timeline and milestones specified',
      'Linkage to clinical evaluation documented',
    ],
    whyItMatters: 'PMCF is a mandatory MDR requirement for demonstrating ongoing clinical safety. The PMCF plan drives proactive clinical data collection.',
    tips: [
      'Align PMCF objectives with the clinical evaluation gaps identified',
      'Consider multiple data collection methods for robustness',
      'Plan for long-term follow-up, especially for implantable devices',
    ],
    commonPitfalls: [
      'PMCF plan is a generic template without device-specific content',
      'No connection to clinical evaluation conclusions',
      'Objectives too vague to be actionable',
    ],
    keyDeliverables: ['PMCF plan'],
  },

  '3.2': {
    section: '3.2',
    title: 'PMCF General and Specific Methods',
    overview: 'Both general methods (literature reviews, database searches) and specific methods (clinical studies, registries) for PMCF must be detailed.',
    expectations: [
      'Literature review protocol defined',
      'Specific clinical data collection methods described',
      'Sample size and statistical approach justified',
      'Data collection instruments specified',
    ],
    whyItMatters: 'The quality of PMCF data depends on the methods used. Poorly designed methods produce unreliable conclusions.',
    tips: [
      'Use validated questionnaires and data collection instruments',
      'Define inclusion/exclusion criteria for literature searches',
      'Consider real-world evidence and registry data',
    ],
    commonPitfalls: [
      'Only literature review planned, no active clinical data collection',
      'Methods not described in sufficient detail',
      'No statistical analysis plan',
    ],
    keyDeliverables: ['PMCF methods documentation', 'Literature review protocol', 'Clinical data collection instruments'],
  },

  '3.3': {
    section: '3.3',
    title: 'PMCF Evaluation Report',
    overview: 'A PMCF evaluation report must document the analysis of collected PMCF data and conclusions on continued safety and performance.',
    expectations: [
      'PMCF data analysis presented with methodology',
      'Conclusions on safety and performance stated',
      'New or emerging risks identified',
      'Recommendations for further action documented',
    ],
    whyItMatters: 'The PMCF evaluation report is the output that feeds back into the clinical evaluation and risk management process.',
    tips: [
      'Present data analysis transparently, including negative findings',
      'Draw clear conclusions — do not leave them ambiguous',
      'Compare findings against pre-market clinical data',
    ],
    commonPitfalls: [
      'Report only summarises data without drawing conclusions',
      'Negative findings not discussed',
      'Report not updated at defined intervals',
    ],
    keyDeliverables: ['PMCF evaluation report'],
  },

  '3.4': {
    section: '3.4',
    title: 'PMCF Conclusions Feed into Clinical Evaluation',
    overview: 'PMCF evaluation report conclusions must be used to update the clinical evaluation, risk management, and benefit-risk analysis.',
    expectations: [
      'Evidence of CER updated based on PMCF conclusions',
      'Risk management file updated with PMCF findings',
      'Benefit-risk analysis revised',
      'Traceability between PMCF findings and document updates',
    ],
    whyItMatters: 'The feedback loop from PMCF to clinical evaluation and risk management is fundamental to MDR. Without it, the clinical evaluation becomes stale and non-compliant.',
    tips: [
      'Maintain a change log showing what was updated based on PMCF findings',
      'Update the CER, risk management file, and PSUR concurrently',
    ],
    commonPitfalls: [
      'PMCF findings not reflected in updated CER',
      'Risk management file not updated with post-market clinical data',
      'No traceability between PMCF report and document revisions',
    ],
    keyDeliverables: ['Updated CER', 'Updated risk management file', 'Change log'],
  },

  '4.1': {
    section: '4.1',
    title: 'Serious Incident Reporting',
    overview: 'Procedures for reporting serious incidents to competent authorities must be documented, with clear timelines per MDR Article 87.',
    expectations: [
      'Serious incident definition clearly stated',
      'Reporting procedure documented step by step',
      'Timelines: 15 days (serious incidents), 10 days (serious public health threats), 2 days (deaths)',
      'Designated responsible person identified',
    ],
    whyItMatters: 'Failure to report serious incidents within the required timelines is a serious regulatory violation with potential legal consequences.',
    tips: [
      'Create a decision tree for determining if an event is a serious incident',
      'Practice the reporting process with mock incidents',
      'Ensure 24/7 coverage for initial incident assessment',
    ],
    commonPitfalls: [
      'Unclear criteria for what constitutes a "serious incident"',
      'No defined process for weekends/holidays',
      'Under-reporting due to lack of awareness',
    ],
    keyDeliverables: ['Incident reporting SOP', 'Serious incident decision tree'],
  },

  '4.2': {
    section: '4.2',
    title: 'Field Safety Corrective Action (FSCA)',
    overview: 'Procedures for initiating and managing FSCAs must be documented, including criteria for when an FSCA is required.',
    expectations: [
      'FSCA initiation criteria defined',
      'FSCA management process documented',
      'Effectiveness verification process defined',
      'Communication with competent authorities during FSCA',
    ],
    whyItMatters: 'FSCAs protect patients and users from identified risks. A well-managed FSCA process demonstrates responsible manufacturer behaviour.',
    tips: [
      'Pre-prepare FSCA templates and communication channels',
      'Define clear roles for FSCA management',
      'Plan for different FSCA types: recall, modification, user notification',
    ],
    commonPitfalls: [
      'No pre-defined FSCA process — creating one during a crisis',
      'Effectiveness of the FSCA not verified',
      'Poor communication with distributors and users',
    ],
    keyDeliverables: ['FSCA procedure', 'FSCA templates'],
  },

  '4.3': {
    section: '4.3',
    title: 'Field Safety Notice (FSN)',
    overview: 'An FSN template and distribution process must be prepared for notifying users and patients of FSCAs.',
    expectations: [
      'FSN template following MDCG guidance format',
      'Distribution process covering all affected users',
      'Acknowledgement tracking mechanism',
      'Multi-language capability if marketed in multiple countries',
    ],
    whyItMatters: 'The FSN is the primary means of communicating safety actions to users. An unclear or poorly distributed FSN undermines the effectiveness of the FSCA.',
    tips: [
      'Use the MDCG-recommended FSN template format',
      'Include clear action items for the recipient',
      'Track acknowledgements to ensure reach',
    ],
    commonPitfalls: [
      'FSN template not prepared in advance',
      'No mechanism to track recipient acknowledgement',
      'FSN written in technical language not understandable by all users',
    ],
    keyDeliverables: ['FSN template', 'FSN distribution procedure'],
  },

  '4.4': {
    section: '4.4',
    title: 'Trend Reporting',
    overview: 'A process for trend reporting must be documented for when a statistically significant increase in serious incidents or expected side effects is identified.',
    expectations: [
      'Trend reporting criteria defined per MDR Article 88',
      'Statistical methods for trend detection documented',
      'Reporting process and timelines defined',
      'Regular trend reviews scheduled',
    ],
    whyItMatters: 'Trend reporting catches safety signals that individual incident reports may miss. It is a specific MDR requirement with defined reporting obligations.',
    tips: [
      'Set up automated trending if complaint volumes are high',
      'Review trends at least quarterly',
      'Consider both frequency trends and severity trends',
    ],
    commonPitfalls: [
      'Trend analysis not conducted regularly',
      'No statistical method defined',
      'Trend reports not submitted to competent authorities when required',
    ],
    keyDeliverables: ['Trend reporting procedure', 'Trend analysis reports'],
  },
};
