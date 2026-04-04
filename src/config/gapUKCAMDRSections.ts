import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const UKCA_MDR_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per UK MDR 2002 classification rules (Class I, IIa, IIb, III) for the UK market.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'UKCA / UKNI marking', description: 'Determine whether UKCA, UKNI, or CE marking is required based on market (GB, NI, or both).', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'UK Responsible Person', description: 'Appoint a UK Responsible Person (UKRP) for devices placed on the GB market by overseas manufacturers.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'MHRA device registration', description: 'Register the device with MHRA before placing it on the GB market.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '5', title: 'UK Approved Body assessment', description: 'Obtain conformity assessment from a UK Approved Body for Class IIa, IIb, and III devices.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Essential requirements (UK MDR 2002)', description: 'Demonstrate compliance with essential requirements per UK MDR 2002 Schedule 1, aligned with EU MDD/MDR principles.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Technical documentation', description: 'Maintain technical documentation demonstrating conformity with essential requirements for MHRA review.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '8', title: 'UK labelling requirements', description: 'Ensure labelling in English meets UK MDR 2002 requirements including UKCA mark, UKRP details, and UDI.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'Post-market surveillance and adverse event reporting', description: 'Establish vigilance and post-market surveillance systems meeting MHRA reporting requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '10', title: 'Clinical evidence', description: 'Provide clinical evidence supporting safety and performance claims per UK clinical evidence requirements.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
];

export const UKCA_MDR_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  UKCA_MDR_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
