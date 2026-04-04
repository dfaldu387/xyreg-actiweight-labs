import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const ANVISA_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per ANVISA risk classes (I, II, III, IV) based on RDC 751/2022 classification rules.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'ANVISA registration / notification', description: 'Submit registration (Class III/IV) or notification (Class I/II) to ANVISA with required documentation.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'Brazilian Registration Holder (BRH)', description: 'Designate a Brazilian Registration Holder with ANVISA for imported medical devices.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'GMP compliance (RDC 16)', description: 'Demonstrate GMP compliance per ANVISA RDC 16 or equivalent (ISO 13485). Prepare for ANVISA or MDSAP audit.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Essential safety and performance requirements', description: 'Demonstrate compliance with ANVISA essential safety and performance requirements based on IMDRF principles.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Clinical evidence', description: 'Provide clinical data supporting safety and effectiveness claims per ANVISA clinical evidence requirements.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Portuguese labelling requirements', description: 'Ensure labelling in Brazilian Portuguese including manufacturer, intended use, lot/serial, expiry, and warnings.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'INMETRO certification', description: 'Obtain INMETRO certification where applicable for specific device categories requiring mandatory certification.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '9', title: 'Post-market surveillance (Tecnovigilância)', description: 'Establish a tecnovigilância system for adverse event reporting and post-market monitoring per ANVISA requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
];

export const ANVISA_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ANVISA_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
