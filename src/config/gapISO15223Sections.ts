import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const ISO_15223_SECTIONS: GenericSectionItem[] = [
  { section: '4.1', title: 'General requirements for symbols', description: 'Use symbols conforming to ISO 15223-1 on medical device labels, packaging, and accompanying information.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Symbol selection and application', description: 'Select appropriate standardised symbols for conveying safety and regulatory information on the device and packaging.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '5.1', title: 'Manufacturer and device identification symbols', description: 'Apply manufacturer name/address, catalogue/model number, batch code, serial number, and date of manufacture symbols.', sectionGroup: 5, sectionGroupName: 'Symbol Categories', type: 'evidence' },
  { section: '5.2', title: 'Handling and storage symbols', description: 'Apply symbols for storage conditions, fragile, keep dry, temperature limits, humidity limits, and stacking limits.', sectionGroup: 5, sectionGroupName: 'Symbol Categories', type: 'evidence' },
  { section: '5.3', title: 'Sterility and safety symbols', description: 'Apply sterilisation method symbols, do not re-sterilise, non-sterile, and biological hazard symbols where applicable.', sectionGroup: 5, sectionGroupName: 'Symbol Categories', type: 'evidence' },
  { section: '5.4', title: 'IVD and transfusion symbols', description: 'Apply in vitro diagnostic, single use, do not re-use, and specific IVD/transfusion symbols where applicable.', sectionGroup: 5, sectionGroupName: 'Symbol Categories', type: 'evidence' },
  { section: '5.5', title: 'Warnings and regulatory symbols', description: 'Apply caution, consult IFU, CE marking, and regulatory compliance symbols.', sectionGroup: 5, sectionGroupName: 'Symbol Categories', type: 'evidence' },
  { section: '6.1', title: 'Symbol verification with target users', description: 'Verify symbol comprehension with intended users per ISO 15223-1 Annex requirements.', sectionGroup: 6, sectionGroupName: 'Verification', type: 'evidence' },
  { section: '6.2', title: 'Documentation of symbol usage', description: 'Maintain records of all symbols used, their meaning, and conformity to ISO 15223-1 in the technical file.', sectionGroup: 6, sectionGroupName: 'Verification', type: 'evidence' },
];

export const ISO_15223_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_15223_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
