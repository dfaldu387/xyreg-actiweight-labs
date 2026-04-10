import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const ISO_10993_SECTIONS: GenericSectionItem[] = [
  // Clause 4 — General Principles
  { section: '4.1', title: 'Biological evaluation within the ISO 14971 risk management framework', description: 'Integrate biological evaluation into the risk management process per ISO 14971, including hazard identification, risk estimation, and risk control.', sectionGroup: 4, sectionGroupName: 'General Principles', type: 'evidence' },
  { section: '4.2', title: 'Biological evaluation process', description: 'Establish and document the biological evaluation process covering all phases from planning through post-production.', sectionGroup: 4, sectionGroupName: 'General Principles', type: 'evidence' },
  { section: '4.3', title: 'Medical device life cycle', description: 'Consider the entire medical device life cycle in the biological evaluation, including design changes, manufacturing, sterilization, and ageing.', sectionGroup: 4, sectionGroupName: 'General Principles', type: 'evidence' },
  { section: '4.4', title: 'Animal welfare', description: 'Apply the 3Rs principle (Replacement, Reduction, Refinement) and justify any use of animal testing.', sectionGroup: 4, sectionGroupName: 'General Principles', type: 'evidence' },

  // Clause 5 — Biological Evaluation Plan
  { section: '5', title: 'Biological evaluation plan', description: 'Document a biological evaluation plan identifying device description, materials, intended use, applicable endpoints, rationale for testing strategy, and standards/guidance used.', sectionGroup: 5, sectionGroupName: 'Biological Evaluation Plan', type: 'evidence' },

  // Clause 6.1–6.4 — Risk Analysis: Characterization & Categorization
  { section: '6.1', title: 'General approach to biological risk analysis', description: 'Describe the general approach to identifying biological hazards, including use of existing data, chemical characterization, and literature.', sectionGroup: 61, sectionGroupName: 'Risk Analysis — Characterization & Categorization', type: 'evidence' },
  { section: '6.2', title: 'Identification of characteristics related to biological safety', description: 'Identify and characterize all materials including chemical composition, additives, processing aids, coatings, degradation products, and sterilization residues.', sectionGroup: 61, sectionGroupName: 'Risk Analysis — Characterization & Categorization', type: 'evidence' },
  { section: '6.3', title: 'Identification of biological hazards, hazardous situations, and potential harms', description: 'Systematically identify biological hazards and hazardous situations that could lead to patient harm from device materials or degradation products.', sectionGroup: 61, sectionGroupName: 'Risk Analysis — Characterization & Categorization', type: 'evidence' },
  { section: '6.4', title: 'Categorization of medical device and determination of scope', description: 'Categorize the device by body contact nature (surface, tissue/bone, circulating blood) and exposure duration (limited ≤24h, prolonged >24h–30d, long-term >30d). Apply Tables 1–4 to determine evaluation scope.', sectionGroup: 61, sectionGroupName: 'Risk Analysis — Characterization & Categorization', type: 'evidence' },

  // Clause 6.5 — Biological Effects for Evaluation
  { section: '6.5.1', title: 'Overall approach to biological effects', description: 'Describe the overall approach for selecting and evaluating applicable biological effects based on device categorization.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.2', title: 'Cytotoxicity', description: 'Evaluate cytotoxicity using in vitro methods per ISO 10993-5.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.3', title: 'Sensitization', description: 'Evaluate sensitization potential using appropriate test methods per ISO 10993-10.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.4', title: 'Irritation', description: 'Evaluate irritation or intracutaneous reactivity per ISO 10993-10 or ISO 10993-23.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.5', title: 'Systemic toxicity', description: 'Evaluate acute, sub-acute, sub-chronic, and chronic systemic toxicity where applicable per ISO 10993-11.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.6', title: 'Local effects after tissue contact', description: 'Evaluate local effects after implantation or tissue contact per ISO 10993-6.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.7', title: 'Genotoxicity', description: 'Evaluate genotoxicity using a battery of in vitro and in vivo tests per ISO 10993-3.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.8', title: 'Carcinogenicity', description: 'Evaluate carcinogenicity potential where applicable, considering material composition and long-term exposure.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.9', title: 'Haemocompatibility', description: 'Evaluate haemocompatibility for devices in contact with blood per ISO 10993-4.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.10', title: 'Other biological effects', description: 'Evaluate immunotoxicity, neurotoxicity, reproductive/developmental toxicity, and material-mediated pyrogenicity where applicable.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },
  { section: '6.5.11', title: 'Other factors to consider', description: 'Consider factors such as brief contact devices, low-risk skin contact, absorption through tissues, materials that change in situ, degradation, particulates, toxicokinetics, and hazardous constituents.', sectionGroup: 65, sectionGroupName: 'Biological Effects for Evaluation', type: 'evidence' },

  // Clause 6.6–6.9 — Gap Analysis, Equivalence & Testing
  { section: '6.6', title: 'Gap analysis', description: 'Perform a gap analysis comparing available data against required biological endpoints and identify any gaps requiring further evaluation.', sectionGroup: 66, sectionGroupName: 'Gap Analysis, Equivalence & Testing', type: 'evidence' },
  { section: '6.7', title: 'Biological equivalence', description: 'Evaluate biological equivalence to predicate or similar devices based on material, manufacturing, sterilization, geometry, and body contact equivalence.', sectionGroup: 66, sectionGroupName: 'Gap Analysis, Equivalence & Testing', type: 'evidence' },
  { section: '6.8', title: 'Testing', description: 'Plan and conduct biological, physical, and chemical testing, including degradation testing and toxicokinetic studies where applicable.', sectionGroup: 66, sectionGroupName: 'Gap Analysis, Equivalence & Testing', type: 'evidence' },
  { section: '6.9', title: 'Biological risk estimation', description: 'Estimate biological risk for each identified hazardous situation based on severity and probability of harm, using available data and test results.', sectionGroup: 66, sectionGroupName: 'Gap Analysis, Equivalence & Testing', type: 'evidence' },

  // Clause 7–8 — Risk Evaluation & Control
  { section: '7', title: 'Biological risk evaluation', description: 'Evaluate estimated biological risks against established acceptability criteria. Determine whether risks are acceptable, require further risk control, or require benefit-risk analysis.', sectionGroup: 78, sectionGroupName: 'Risk Evaluation & Control', type: 'evidence' },
  { section: '8', title: 'Biological risk control', description: 'Implement risk control measures for unacceptable biological risks using the priority: inherent safety by design, protective measures, information for safety. Verify implementation and effectiveness.', sectionGroup: 78, sectionGroupName: 'Risk Evaluation & Control', type: 'evidence' },

  // Clause 9–10 — Reporting & Post-Production
  { section: '9', title: 'Biological evaluation report', description: 'Compile a biological evaluation report summarizing all testing, risk assessment, equivalence analysis, and conclusions. Include endpoint coverage matrix and overall biocompatibility determination.', sectionGroup: 910, sectionGroupName: 'Reporting & Post-Production', type: 'evidence' },
  { section: '10', title: 'Production and post-production activities', description: 'Establish processes for collecting and reviewing production and post-production information relevant to biological safety, including complaints, adverse events, and material changes.', sectionGroup: 910, sectionGroupName: 'Reporting & Post-Production', type: 'evidence' },
];


export const ISO_10993_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_10993_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
