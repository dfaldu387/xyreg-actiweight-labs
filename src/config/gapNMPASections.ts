import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const NMPA_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per NMPA classification rules (Class I, II, III) based on risk and intended use.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'Registration dossier preparation', description: 'Prepare the registration dossier per NMPA Order 4/6 including summary, technical documentation, and clinical data.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'In-country agent / legal representative', description: 'Appoint an in-country agent or legal representative for foreign manufacturers registering with NMPA.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'Product technical requirements', description: 'Develop product technical requirements document per NMPA guidelines including performance specifications and test methods.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'GMP / manufacturing quality system', description: 'Demonstrate GMP compliance per Chinese medical device GMP requirements. Prepare for NMPA on-site audit if required.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Clinical evaluation / clinical trials', description: 'Provide clinical evaluation or conduct clinical trials in China per NMPA clinical trial requirements for Class III or novel devices.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Chinese labelling requirements', description: 'Ensure labelling in Simplified Chinese including manufacturer, specifications, intended use, warnings, and registration certificate number.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Type testing at Chinese labs', description: 'Complete type testing at NMPA-designated testing laboratories for applicable product standards.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '9', title: 'Post-market surveillance and adverse event reporting', description: 'Establish adverse event monitoring and reporting system per NMPA post-market requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '10', title: 'Registration certificate renewal', description: 'Plan for registration certificate renewal (every 5 years) and change notification procedures.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
];

export const NMPA_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  NMPA_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
