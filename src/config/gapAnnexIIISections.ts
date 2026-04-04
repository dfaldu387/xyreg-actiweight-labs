import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

/**
 * MDR Annex III — Technical Documentation on Post-Market Surveillance
 */
export const ANNEX_III_SECTIONS: GenericSectionItem[] = [
  // §1 Post-market surveillance plan
  { section: '1.1', title: 'PMS plan — systematic process to collect and utilise data', description: 'Describe the systematic process to collect, record, and analyse data on device quality, performance, and safety throughout its lifetime.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },
  { section: '1.2', title: 'Plan covers proactive data collection from similar devices', description: 'Show that the PMS plan includes proactive collection of data from similar devices on the market, including literature reviews and database searches.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },
  { section: '1.3', title: 'Plan includes investigation of complaints and incidents', description: 'Demonstrate that the PMS plan covers systematic investigation of complaints, adverse events, and field safety corrective actions.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },
  { section: '1.4', title: 'Plan includes trend analysis (statistically significant increase in incidents)', description: 'Show methodology for identifying statistically significant increases in the frequency or severity of incidents or adverse events.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },
  { section: '1.5', title: 'Plan specifies indicators and thresholds for re-evaluation of benefit-risk', description: 'Define indicators and threshold values that trigger a re-evaluation of the benefit-risk ratio and potential corrective actions.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },
  { section: '1.6', title: 'Plan covers communication with competent authorities and notified bodies', description: 'Document procedures for communicating PMS findings to competent authorities and notified bodies as required by MDR Articles 83-86.', sectionGroup: 1, sectionGroupName: 'Post-Market Surveillance Plan', type: 'evidence' },

  // §2 PMS report / PSUR
  { section: '2.1', title: 'PMS report for Class I devices', description: 'For Class I devices: compile a PMS report summarising results and conclusions of PMS data analysis, with rationale and description of any corrective actions taken.', sectionGroup: 2, sectionGroupName: 'PMS Report / PSUR', type: 'evidence' },
  { section: '2.2', title: 'PSUR for Class IIa, IIb, and III devices', description: 'For Class IIa/IIb/III devices: prepare a Periodic Safety Update Report (PSUR) including benefit-risk conclusions, PMCF findings, sales volume, and supplier contributions.', sectionGroup: 2, sectionGroupName: 'PMS Report / PSUR', type: 'evidence',
    subItems: [
      { letter: 'a', description: 'Conclusions of benefit-risk determination' },
      { letter: 'b', description: 'Main findings of the PMCF' },
      { letter: 'c', description: 'Volume of sales and estimated number of users/patients' },
      { letter: 'd', description: 'Summary of contributions to PMS data from sub-contractors/suppliers' },
    ],
  },

  // §3 Post-market clinical follow-up (PMCF)
  { section: '3.1', title: 'PMCF plan — clinical data collection throughout device lifetime', description: 'Establish a PMCF plan specifying methods to proactively collect and evaluate clinical data throughout the device lifetime to confirm safety and performance.', sectionGroup: 3, sectionGroupName: 'Post-Market Clinical Follow-Up', type: 'evidence' },
  { section: '3.2', title: 'PMCF plan includes general and specific methods for evaluation', description: 'Detail the general and specific methods for clinical data evaluation: clinical studies, registries, literature surveys, or other systematic data sources.', sectionGroup: 3, sectionGroupName: 'Post-Market Clinical Follow-Up', type: 'evidence' },
  { section: '3.3', title: 'PMCF evaluation report — analysis of PMCF data', description: 'Compile a PMCF evaluation report documenting the analysis of PMCF data, including conclusions on continued safety and performance.', sectionGroup: 3, sectionGroupName: 'Post-Market Clinical Follow-Up', type: 'evidence' },
  { section: '3.4', title: 'PMCF evaluation report conclusions feed into clinical evaluation', description: 'Show that PMCF evaluation report conclusions are used to update the clinical evaluation, risk management, and benefit-risk analysis.', sectionGroup: 3, sectionGroupName: 'Post-Market Clinical Follow-Up', type: 'evidence' },

  // §4 Vigilance
  { section: '4.1', title: 'Serious incident reporting procedures', description: 'Document procedures for reporting serious incidents to competent authorities within the required timeframes per MDR Article 87.', sectionGroup: 4, sectionGroupName: 'Vigilance', type: 'evidence' },
  { section: '4.2', title: 'Field safety corrective action (FSCA) procedures', description: 'Describe procedures for initiating and managing field safety corrective actions, including criteria for when FSCA is required.', sectionGroup: 4, sectionGroupName: 'Vigilance', type: 'evidence' },
  { section: '4.3', title: 'Field safety notice (FSN) template and process', description: 'Provide the FSN template and process for notifying users and patients of field safety corrective actions.', sectionGroup: 4, sectionGroupName: 'Vigilance', type: 'evidence' },
  { section: '4.4', title: 'Trend reporting — statistically significant increase in incidents', description: 'Document the process for trend reporting when a statistically significant increase in serious incidents or expected side effects is identified.', sectionGroup: 4, sectionGroupName: 'Vigilance', type: 'evidence' },
];

export const ANNEX_III_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ANNEX_III_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
