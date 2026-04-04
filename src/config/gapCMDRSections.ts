import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const CMDR_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the medical device per CMDR Schedule 1 (Class I–IV) based on risk level and intended use.', sectionGroup: 1, sectionGroupName: 'Classification & Licensing', type: 'evidence' },
  { section: '2', title: 'Medical device licence application', description: 'Prepare and submit a medical device licence (MDL) application to Health Canada for Class II, III, or IV devices.', sectionGroup: 1, sectionGroupName: 'Classification & Licensing', type: 'evidence' },
  { section: '3', title: 'Establishment licence', description: 'Obtain a Medical Device Establishment Licence (MDEL) for importing or distributing medical devices in Canada.', sectionGroup: 1, sectionGroupName: 'Classification & Licensing', type: 'evidence' },
  { section: '4', title: 'Safety and effectiveness requirements', description: 'Demonstrate device safety and effectiveness per CMDR sections 10–20 including design, materials, and performance.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Quality management system (ISO 13485)', description: 'Maintain an ISO 13485-compliant QMS. Provide QMS certificates for Class III and IV licence applications.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Labelling requirements', description: 'Ensure bilingual labelling (English/French) meeting CMDR sections 21–23 including device name, manufacturer, directions for use.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '7', title: 'Mandatory problem reporting', description: 'Establish a system for mandatory reporting of incidents to Health Canada per CMDR Part 1, Division 3.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Medical device single audit program (MDSAP)', description: 'Ensure MDSAP audit coverage for Canadian regulatory requirements as accepted by Health Canada.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'Clinical evidence', description: 'Provide clinical evidence supporting safety and effectiveness claims per Health Canada guidance documents.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '10', title: 'UDI requirements', description: 'Comply with Canadian UDI requirements for device identification and traceability.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
];

export const CMDR_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  CMDR_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
