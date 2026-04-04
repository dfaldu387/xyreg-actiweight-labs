import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

// Device-level clauses (3.4–10): risk management plan, analysis, evaluation, control, review, report
export const ISO_14971_DEVICE_SECTIONS: GenericSectionItem[] = [
  { section: '3.4', title: 'Risk management plan', description: 'Create a device-specific risk management plan defining scope, responsibilities, review criteria, risk acceptability, verification activities, and post-production monitoring.', sectionGroup: 3, sectionGroupName: 'Risk Management Plan', type: 'evidence',
    subItems: [
      { letter: 'a', description: 'Scope of the plan' },
      { letter: 'b', description: 'Assignment of responsibilities and authorities' },
      { letter: 'c', description: 'Requirements for review of risk management activities' },
      { letter: 'd', description: 'Criteria for risk acceptability' },
      { letter: 'e', description: 'Verification activities' },
      { letter: 'f', description: 'Activities related to collection and review of production/post-production information' },
    ],
  },
  { section: '3.5', title: 'Risk management file', description: 'Maintain a risk management file containing all records and documents produced by the risk management process for this device.', sectionGroup: 3, sectionGroupName: 'Risk Management Plan', type: 'evidence' },

  // §4 Risk analysis
  { section: '4.1', title: 'Risk analysis process', description: 'Perform risk analysis for the device: define intended use, identify hazards, estimate risks. Document the process and results.', sectionGroup: 4, sectionGroupName: 'Risk Analysis', type: 'evidence' },
  { section: '4.2', title: 'Intended use and reasonably foreseeable misuse', description: 'Document the intended use, intended users, and reasonably foreseeable misuse of the device.', sectionGroup: 4, sectionGroupName: 'Risk Analysis', type: 'evidence' },
  { section: '4.3', title: 'Identification of characteristics related to safety', description: 'Identify device characteristics that could impact safety using Annex C of ISO 14971 as a guide. Document the analysis.', sectionGroup: 4, sectionGroupName: 'Risk Analysis', type: 'evidence' },
  { section: '4.4', title: 'Identification of hazards and hazardous situations', description: 'Systematically identify known and foreseeable hazards in both normal use and fault conditions. Document in the risk management file.', sectionGroup: 4, sectionGroupName: 'Risk Analysis', type: 'evidence' },
  { section: '4.5', title: 'Risk estimation', description: 'For each identified hazardous situation, estimate the associated risk using the probability of occurrence and severity of harm.', sectionGroup: 4, sectionGroupName: 'Risk Analysis', type: 'evidence' },

  // §5 Risk evaluation
  { section: '5', title: 'Risk evaluation', description: 'Evaluate each estimated risk against the acceptability criteria defined in the risk management plan. Determine which risks require risk control.', sectionGroup: 5, sectionGroupName: 'Risk Evaluation', type: 'evidence' },

  // §6 Risk control
  { section: '6.1', title: 'Risk control option analysis', description: 'Analyse risk control options following the priority: inherent safety by design, protective measures, information for safety.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },
  { section: '6.2', title: 'Implementation of risk control measures', description: 'Implement the selected risk control measures and verify their effectiveness. Document implementation evidence.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },
  { section: '6.3', title: 'Residual risk evaluation', description: 'Evaluate residual risk after applying risk control measures. Determine if residual risk is acceptable per the risk management plan.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },
  { section: '6.4', title: 'Benefit-risk analysis', description: 'If residual risk is not acceptable, perform benefit-risk analysis to determine if medical benefits outweigh the residual risk.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },
  { section: '6.5', title: 'Risks arising from risk control measures', description: 'Evaluate whether the implemented risk control measures introduce new hazards or increase existing risks.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },
  { section: '6.6', title: 'Completeness of risk control', description: 'Verify that all identified hazardous situations have been considered and risk control is complete.', sectionGroup: 6, sectionGroupName: 'Risk Control', type: 'evidence' },

  // §7 Evaluation of overall residual risk
  { section: '7', title: 'Evaluation of overall residual risk', description: 'Evaluate the overall residual risk posed by the device considering all individual residual risks together. Document the acceptability determination.', sectionGroup: 7, sectionGroupName: 'Evaluation of Overall Residual Risk', type: 'evidence' },

  // §8 Risk management review
  { section: '8', title: 'Risk management review', description: 'Conduct a review to ensure the risk management plan has been executed, overall residual risk is acceptable, and appropriate methods are in place to collect post-production information.', sectionGroup: 8, sectionGroupName: 'Risk Management Review', type: 'evidence' },

  // §9 Production and post-production activities
  { section: '9', title: 'Production and post-production activities', description: 'Establish a system to collect and review production and post-production information relevant to safety. Feed findings back into the risk management process.', sectionGroup: 9, sectionGroupName: 'Production & Post-Production', type: 'evidence' },

  // §10 Risk management report
  { section: '10', title: 'Risk management report', description: 'Compile the risk management report summarizing the risk management process results, including overall residual risk acceptability and traceability of all hazards to risk control measures.', sectionGroup: 10, sectionGroupName: 'Risk Management Report', type: 'evidence' },
];

export const ISO_14971_DEVICE_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_14971_DEVICE_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
