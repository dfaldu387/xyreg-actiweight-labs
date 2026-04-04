import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const CDSCO_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per Indian MDR 2017 risk classes (A, B, C, D) based on intended use and risk level.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'Registration / import licence', description: 'Obtain registration certificate or import licence from CDSCO for the medical device.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'Authorized Indian agent', description: 'Appoint an authorized Indian agent for foreign manufacturers applying for device registration.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'Quality management system', description: 'Demonstrate QMS compliance per Indian MDR 2017 Schedule 5 requirements or ISO 13485 certification.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Essential principles of safety and performance', description: 'Demonstrate compliance with essential principles per Indian MDR 2017 Schedule 2.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Clinical investigation / clinical evidence', description: 'Provide clinical evidence or conduct clinical investigation per CDSCO requirements for Class C/D devices.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Indian labelling requirements', description: 'Ensure labelling in English and Hindi (where required) meeting MDR 2017 Schedule 4 requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Post-market surveillance and vigilance', description: 'Establish adverse event reporting system to CDSCO and implement post-market surveillance per MDR 2017.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'BIS standards compliance', description: 'Comply with applicable Bureau of Indian Standards (BIS) standards referenced in Indian MDR 2017.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
];

export const CDSCO_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  CDSCO_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
