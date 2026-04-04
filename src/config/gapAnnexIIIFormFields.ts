/**
 * MDR Annex III (PMS / PMCF / Vigilance) — Clause-Specific Form Field Definitions
 * Step-by-step guided structure for post-market surveillance (§1–4).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const MDR_ANNEX_III_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §1 Post-Market Surveillance Plan
  // ═══════════════════════════════════════════════════════════
  '1.1': {
    clauseTitle: '1.1 — PMS Plan: Systematic Process',
    evidenceRequired: true,
    steps: [
      {
        id: '1.1_process',
        stepLabel: 'PMS Data Collection Process',
        requirementText: 'Describe the systematic process to collect, record, and analyse data on device quality, performance, and safety throughout its lifetime.',
        fields: [
          { id: 'pms_process', label: 'PMS data collection process', type: 'richtext', helpText: 'Describe the systematic process for collecting and utilising PMS data: sources, frequency, responsibilities, and tools.' },
          { id: 'data_sources', label: 'Data sources', type: 'richtext', helpText: 'List all PMS data sources: complaints, vigilance databases, literature, clinical studies, registries.' },
          { id: 'pms_plan_ref', label: 'PMS plan document', type: 'doc_reference', required: true, helpText: 'Link to the post-market surveillance plan.' },
        ],
      },
    ],
  },

  '1.2': {
    clauseTitle: '1.2 — Proactive Data Collection from Similar Devices',
    evidenceRequired: true,
    steps: [
      {
        id: '1.2_similar',
        stepLabel: 'Similar Device Data Collection',
        requirementText: 'Show that the PMS plan includes proactive collection of data from similar devices on the market.',
        fields: [
          { id: 'similar_devices', label: 'Similar device identification', type: 'richtext', helpText: 'Identify similar devices and equivalent products used as data sources.' },
          { id: 'collection_methods', label: 'Data collection methods', type: 'richtext', helpText: 'Describe methods: literature reviews, database searches (MAUDE, BfArM, MHRA), competitor analysis.' },
          { id: 'similar_ref', label: 'Similar device analysis reference', type: 'doc_reference', helpText: 'Link to similar device data analysis documentation.' },
        ],
      },
    ],
  },

  '1.3': {
    clauseTitle: '1.3 — Investigation of Complaints and Incidents',
    evidenceRequired: true,
    steps: [
      {
        id: '1.3_complaints',
        stepLabel: 'Complaint & Incident Investigation',
        requirementText: 'Demonstrate that the PMS plan covers systematic investigation of complaints, adverse events, and field safety corrective actions.',
        fields: [
          { id: 'complaint_process', label: 'Complaint investigation process', type: 'richtext', helpText: 'Describe the process for receiving, recording, and investigating complaints and adverse events.' },
          { id: 'fsca_process', label: 'FSCA tracking process', type: 'richtext', helpText: 'Describe how field safety corrective actions are tracked and their effectiveness evaluated.' },
          { id: 'complaint_ref', label: 'Complaint handling procedure', type: 'doc_reference', helpText: 'Link to complaint handling SOP.' },
        ],
      },
    ],
  },

  '1.4': {
    clauseTitle: '1.4 — Trend Analysis',
    evidenceRequired: true,
    steps: [
      {
        id: '1.4_trends',
        stepLabel: 'Trend Analysis Methodology',
        requirementText: 'Show methodology for identifying statistically significant increases in the frequency or severity of incidents.',
        fields: [
          { id: 'trend_methodology', label: 'Trend analysis methodology', type: 'richtext', helpText: 'Describe statistical methods used for trend identification: control charts, regression analysis, threshold triggers.' },
          { id: 'trend_thresholds', label: 'Trigger thresholds', type: 'richtext', helpText: 'Define the thresholds or criteria that trigger escalation (e.g., complaint rate increase, new failure mode).' },
          { id: 'trend_ref', label: 'Trend analysis procedure reference', type: 'doc_reference', helpText: 'Link to the trend analysis procedure.' },
        ],
      },
    ],
  },

  '1.5': {
    clauseTitle: '1.5 — Indicators and Thresholds for Benefit-Risk Re-evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '1.5_indicators',
        stepLabel: 'Benefit-Risk Indicators',
        requirementText: 'Define indicators and threshold values that trigger a re-evaluation of the benefit-risk ratio.',
        fields: [
          { id: 'indicators', label: 'Defined indicators', type: 'richtext', helpText: 'List the indicators monitored (e.g., complaint rate, serious incident rate, device failure rate) and their threshold values.' },
          { id: 'reevaluation_process', label: 'Re-evaluation process', type: 'richtext', helpText: 'Describe the process triggered when thresholds are exceeded, including who is responsible and what actions are taken.' },
        ],
      },
    ],
  },

  '1.6': {
    clauseTitle: '1.6 — Communication with Competent Authorities',
    evidenceRequired: true,
    steps: [
      {
        id: '1.6_communication',
        stepLabel: 'Authority Communication',
        requirementText: 'Document procedures for communicating PMS findings to competent authorities and notified bodies.',
        fields: [
          { id: 'communication_procedures', label: 'Communication procedures', type: 'richtext', helpText: 'Describe procedures for reporting to competent authorities and notified bodies per MDR Articles 83-86.' },
          { id: 'reporting_timelines', label: 'Reporting timelines', type: 'richtext', helpText: 'State the reporting timelines for different event severities (e.g., serious incidents within 15 days, trends within specified periods).' },
          { id: 'comms_ref', label: 'Communication procedure reference', type: 'doc_reference', helpText: 'Link to the authority communication procedure.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §2 PMS Report / PSUR
  // ═══════════════════════════════════════════════════════════
  '2.1': {
    clauseTitle: '2.1 — PMS Report for Class I Devices',
    evidenceRequired: true,
    steps: [
      {
        id: '2.1_report',
        stepLabel: 'PMS Report',
        requirementText: 'For Class I devices: compile a PMS report summarising results and conclusions.',
        fields: [
          { id: 'pms_report_content', label: 'PMS report content', type: 'richtext', helpText: 'Summarise the PMS data analysis results, conclusions drawn, and any corrective actions taken.' },
          { id: 'update_frequency', label: 'Report update frequency', type: 'select', options: ['As needed', 'Annually', 'Biannually'], helpText: 'How often is the PMS report updated?' },
          { id: 'pms_report_ref', label: 'PMS report document', type: 'doc_reference', required: true, helpText: 'Link to the current PMS report.' },
        ],
      },
    ],
  },

  '2.2': {
    clauseTitle: '2.2 — PSUR for Class IIa, IIb, and III Devices',
    evidenceRequired: true,
    steps: [
      {
        id: '2.2_psur_content',
        stepLabel: 'PSUR Content',
        requirementText: 'Prepare a Periodic Safety Update Report (PSUR) including benefit-risk conclusions, PMCF findings, sales volume, and supplier contributions.',
        fields: [
          { id: 'benefit_risk', label: 'Benefit-risk determination conclusions', type: 'richtext', helpText: 'State the conclusions of the benefit-risk determination and whether the benefit-risk ratio remains acceptable.' },
          { id: 'pmcf_findings', label: 'Main PMCF findings', type: 'richtext', helpText: 'Summarise the main findings from post-market clinical follow-up activities.' },
          { id: 'sales_volume', label: 'Sales volume and user/patient estimates', type: 'richtext', helpText: 'Provide volume of sales and estimated number of users/patients exposed.' },
          { id: 'supplier_contributions', label: 'Supplier PMS contributions', type: 'richtext', helpText: 'Summarise PMS data contributions from sub-contractors and suppliers.' },
        ],
      },
      {
        id: '2.2_psur_submission',
        stepLabel: 'PSUR Submission',
        requirementText: 'Document PSUR submission frequency and recipients.',
        fields: [
          { id: 'submission_frequency', label: 'PSUR submission frequency', type: 'select', options: ['Annually (Class IIa)', 'Annually (Class IIb/III)', 'As required by NB'], helpText: 'Class IIa: at least every 2 years. Class IIb/III: at least annually.' },
          { id: 'psur_ref', label: 'PSUR document', type: 'doc_reference', required: true, helpText: 'Link to the current PSUR.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §3 Post-Market Clinical Follow-Up
  // ═══════════════════════════════════════════════════════════
  '3.1': {
    clauseTitle: '3.1 — PMCF Plan',
    evidenceRequired: true,
    steps: [
      {
        id: '3.1_plan',
        stepLabel: 'PMCF Plan',
        requirementText: 'Establish a PMCF plan specifying methods to proactively collect and evaluate clinical data.',
        fields: [
          { id: 'pmcf_objectives', label: 'PMCF objectives', type: 'richtext', helpText: 'State the objectives of the PMCF plan: confirming safety, performance, identifying emerging risks, detecting misuse.' },
          { id: 'pmcf_methods', label: 'PMCF methods', type: 'richtext', helpText: 'Describe methods: clinical studies, registries, surveys, literature reviews, real-world evidence collection.' },
          { id: 'pmcf_plan_ref', label: 'PMCF plan document', type: 'doc_reference', required: true, helpText: 'Link to the PMCF plan.' },
        ],
      },
    ],
  },

  '3.2': {
    clauseTitle: '3.2 — PMCF General and Specific Methods',
    evidenceRequired: true,
    steps: [
      {
        id: '3.2_methods',
        stepLabel: 'PMCF Evaluation Methods',
        requirementText: 'Detail the general and specific methods for clinical data evaluation.',
        fields: [
          { id: 'general_methods', label: 'General evaluation methods', type: 'richtext', helpText: 'Describe general methods: systematic literature review protocol, database search strategy.' },
          { id: 'specific_methods', label: 'Specific evaluation methods', type: 'richtext', helpText: 'Describe specific methods: clinical investigations, registries, patient outcome studies, questionnaires.' },
          { id: 'methods_ref', label: 'PMCF methods documentation', type: 'doc_reference', helpText: 'Link to PMCF methods documentation.' },
        ],
      },
    ],
  },

  '3.3': {
    clauseTitle: '3.3 — PMCF Evaluation Report',
    evidenceRequired: true,
    steps: [
      {
        id: '3.3_report',
        stepLabel: 'PMCF Evaluation Report',
        requirementText: 'Compile a PMCF evaluation report documenting the analysis of PMCF data.',
        fields: [
          { id: 'pmcf_data_analysis', label: 'PMCF data analysis', type: 'richtext', helpText: 'Summarise the analysis of PMCF data collected and conclusions on safety and performance.' },
          { id: 'pmcf_conclusions', label: 'PMCF conclusions', type: 'richtext', helpText: 'State conclusions on continued safety and performance, including any new risks identified.' },
          { id: 'pmcf_report_ref', label: 'PMCF evaluation report', type: 'doc_reference', required: true, helpText: 'Link to the PMCF evaluation report.' },
        ],
      },
    ],
  },

  '3.4': {
    clauseTitle: '3.4 — PMCF Conclusions Feed into Clinical Evaluation',
    evidenceRequired: true,
    steps: [
      {
        id: '3.4_integration',
        stepLabel: 'Integration with Clinical Evaluation',
        requirementText: 'Show that PMCF conclusions are used to update the clinical evaluation, risk management, and benefit-risk analysis.',
        fields: [
          { id: 'cer_update', label: 'Clinical evaluation report update', type: 'richtext', helpText: 'Describe how PMCF findings are fed back into the clinical evaluation report.' },
          { id: 'risk_update', label: 'Risk management update', type: 'richtext', helpText: 'Describe how PMCF findings trigger updates to the risk management file.' },
          { id: 'benefit_risk_update', label: 'Benefit-risk update', type: 'richtext', helpText: 'Explain how the benefit-risk analysis is updated based on PMCF conclusions.' },
          { id: 'integration_ref', label: 'Integration evidence reference', type: 'doc_reference', helpText: 'Link to evidence of PMCF integration (e.g., updated CER, risk file revision).' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §4 Vigilance
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Serious Incident Reporting',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_reporting',
        stepLabel: 'Incident Reporting Procedures',
        requirementText: 'Document procedures for reporting serious incidents to competent authorities within the required timeframes.',
        fields: [
          { id: 'reporting_procedure', label: 'Serious incident reporting procedure', type: 'richtext', helpText: 'Describe the process for identifying, assessing, and reporting serious incidents per MDR Article 87.' },
          { id: 'reporting_timelines', label: 'Reporting timelines', type: 'richtext', helpText: 'Confirm timelines: 15 days for serious incidents, 10 days for serious public health threats, 2 days for deaths.' },
          { id: 'reporting_ref', label: 'Incident reporting SOP', type: 'doc_reference', required: true, helpText: 'Link to the serious incident reporting procedure.' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Field Safety Corrective Action (FSCA)',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_fsca',
        stepLabel: 'FSCA Procedures',
        requirementText: 'Describe procedures for initiating and managing field safety corrective actions.',
        fields: [
          { id: 'fsca_criteria', label: 'FSCA initiation criteria', type: 'richtext', helpText: 'Define criteria for when a field safety corrective action is required.' },
          { id: 'fsca_process', label: 'FSCA management process', type: 'richtext', helpText: 'Describe the process for managing FSCAs including decision-making, implementation, and effectiveness verification.' },
          { id: 'fsca_ref', label: 'FSCA procedure reference', type: 'doc_reference', helpText: 'Link to the FSCA procedure.' },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — Field Safety Notice (FSN)',
    evidenceRequired: true,
    steps: [
      {
        id: '4.3_fsn',
        stepLabel: 'FSN Template and Process',
        requirementText: 'Provide the FSN template and process for notifying users and patients.',
        fields: [
          { id: 'fsn_template', label: 'FSN template description', type: 'richtext', helpText: 'Describe the FSN template structure and content requirements per MDCG guidance.' },
          { id: 'fsn_distribution', label: 'FSN distribution process', type: 'richtext', helpText: 'Describe how FSNs are distributed to affected users, patients, and competent authorities.' },
          { id: 'fsn_ref', label: 'FSN template reference', type: 'doc_reference', helpText: 'Link to the FSN template.' },
        ],
      },
    ],
  },

  '4.4': {
    clauseTitle: '4.4 — Trend Reporting',
    evidenceRequired: true,
    steps: [
      {
        id: '4.4_trend_reporting',
        stepLabel: 'Trend Reporting Process',
        requirementText: 'Document the process for trend reporting when a statistically significant increase in serious incidents is identified.',
        fields: [
          { id: 'trend_reporting_process', label: 'Trend reporting process', type: 'richtext', helpText: 'Describe the process for identifying trends and reporting them to competent authorities per MDR Article 88.' },
          { id: 'statistical_methods', label: 'Statistical methods for trend detection', type: 'richtext', helpText: 'Describe statistical methods used to detect statistically significant increases in incidents or expected side effects.' },
          { id: 'trend_ref', label: 'Trend reporting procedure', type: 'doc_reference', helpText: 'Link to the trend reporting procedure.' },
        ],
      },
    ],
  },
};
