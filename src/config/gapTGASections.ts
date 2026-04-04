import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const TGA_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per TGA classification rules (Class I, IIa, IIb, III, AIMD) based on intended purpose and risk.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'Australian sponsor registration', description: 'Register as an Australian sponsor with the TGA to import or supply medical devices in Australia.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'ARTG inclusion', description: 'Include the device on the Australian Register of Therapeutic Goods (ARTG) before supply.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'Conformity assessment procedures', description: 'Complete appropriate conformity assessment procedures and obtain certification from a TGA-recognised body.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Essential principles of safety and performance', description: 'Demonstrate compliance with the Essential Principles per TGO 110 applicable to the device type.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Technical documentation', description: 'Maintain technical documentation supporting conformity with essential principles, available for TGA audit.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Labelling (TGO 91/92)', description: 'Ensure labelling complies with Australian requirements including TGO 91 (general) and TGO 92 (IVDs).', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Post-market obligations', description: 'Establish systems for adverse event reporting, recalls, and post-market surveillance as required by TGA.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'Clinical evidence', description: 'Provide clinical evidence demonstrating safety and performance per TGA clinical evidence guidelines.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
];

export const TGA_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  TGA_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
