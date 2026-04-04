import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const ISO_10993_SECTIONS: GenericSectionItem[] = [
  // Part 1 — Evaluation and testing within a risk management process
  { section: '4.1', title: 'Biological evaluation plan', description: 'Establish a biological evaluation plan within the risk management process addressing material characterization and endpoint selection.', sectionGroup: 4, sectionGroupName: 'Evaluation Planning', type: 'evidence' },
  { section: '4.2', title: 'Material characterization', description: 'Characterize all materials in the device including chemical composition, additives, processing aids, and degradation products.', sectionGroup: 4, sectionGroupName: 'Evaluation Planning', type: 'evidence' },
  { section: '4.3', title: 'Device categorization by contact type and duration', description: 'Categorize the device by nature of body contact (surface, external communicating, implant) and contact duration (limited, prolonged, permanent).', sectionGroup: 4, sectionGroupName: 'Evaluation Planning', type: 'evidence' },
  { section: '4.4', title: 'Selection of biological endpoints', description: 'Select applicable biological endpoints based on device categorization using ISO 10993-1 Table A.1.', sectionGroup: 4, sectionGroupName: 'Evaluation Planning', type: 'evidence' },

  // Biological endpoints
  { section: '5.1', title: 'Cytotoxicity (ISO 10993-5)', description: 'Evaluate cytotoxicity using in vitro methods per ISO 10993-5 where applicable.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.2', title: 'Sensitization (ISO 10993-10)', description: 'Evaluate sensitization potential using appropriate test methods per ISO 10993-10.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.3', title: 'Irritation / intracutaneous reactivity (ISO 10993-10/23)', description: 'Evaluate irritation or intracutaneous reactivity where applicable.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.4', title: 'Systemic toxicity (ISO 10993-11)', description: 'Evaluate acute and sub-chronic/chronic systemic toxicity where applicable per ISO 10993-11.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.5', title: 'Genotoxicity (ISO 10993-3)', description: 'Evaluate genotoxicity using a battery of in vitro and in vivo tests per ISO 10993-3.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.6', title: 'Implantation (ISO 10993-6)', description: 'Evaluate local effects of implantation where applicable per ISO 10993-6.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },
  { section: '5.7', title: 'Haemocompatibility (ISO 10993-4)', description: 'Evaluate haemocompatibility for devices in contact with blood per ISO 10993-4.', sectionGroup: 5, sectionGroupName: 'Biological Endpoints', type: 'evidence' },

  // Chemical characterization & reporting
  { section: '6.1', title: 'Chemical characterization (ISO 10993-18)', description: 'Perform chemical characterization of device materials and extractables/leachables per ISO 10993-18.', sectionGroup: 6, sectionGroupName: 'Chemical Characterization & Reporting', type: 'evidence' },
  { section: '6.2', title: 'Toxicological risk assessment (ISO 10993-17)', description: 'Conduct toxicological risk assessment of identified chemicals using allowable limits per ISO 10993-17.', sectionGroup: 6, sectionGroupName: 'Chemical Characterization & Reporting', type: 'evidence' },
  { section: '6.3', title: 'Biological evaluation report', description: 'Compile a biological evaluation report summarizing all testing, risk assessment, and conclusions per ISO 10993-1.', sectionGroup: 6, sectionGroupName: 'Chemical Characterization & Reporting', type: 'evidence' },
];

export const ISO_10993_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_10993_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
