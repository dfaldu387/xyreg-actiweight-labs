import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const ISO_20417_SECTIONS: GenericSectionItem[] = [
  { section: '4.1', title: 'General requirements for information supplied', description: 'Ensure all information supplied by the manufacturer is accurate, accessible, and meets the requirements of ISO 20417.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Language requirements', description: 'Provide information in the official language(s) of the country where the device is placed on the market.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '5.1', title: 'Label content — manufacturer identification', description: 'Include manufacturer name, address, device name, model, and UDI on the device label.', sectionGroup: 5, sectionGroupName: 'Labelling', type: 'evidence' },
  { section: '5.2', title: 'Label content — safety and performance', description: 'Include warnings, precautions, contraindications, expiry date, lot/serial, storage conditions on the label.', sectionGroup: 5, sectionGroupName: 'Labelling', type: 'evidence' },
  { section: '5.3', title: 'Label content — sterile and single-use devices', description: 'Provide sterilisation method, sterile barrier system information, and single-use/do-not-reuse markings.', sectionGroup: 5, sectionGroupName: 'Labelling', type: 'evidence' },
  { section: '6.1', title: 'Instructions for use — general content', description: 'Include intended purpose, intended users, indications, contraindications, warnings, precautions in the IFU.', sectionGroup: 6, sectionGroupName: 'Instructions for Use', type: 'evidence' },
  { section: '6.2', title: 'Instructions for use — installation and setup', description: 'Provide installation, assembly, calibration, and initial setup instructions where applicable.', sectionGroup: 6, sectionGroupName: 'Instructions for Use', type: 'evidence' },
  { section: '6.3', title: 'Instructions for use — operation and maintenance', description: 'Provide operating instructions, maintenance procedures, cleaning/disinfection, and troubleshooting guidance.', sectionGroup: 6, sectionGroupName: 'Instructions for Use', type: 'evidence' },
  { section: '6.4', title: 'Instructions for use — disposal and end of life', description: 'Provide disposal instructions, environmental considerations, and end-of-life procedures.', sectionGroup: 6, sectionGroupName: 'Instructions for Use', type: 'evidence' },
  { section: '7.1', title: 'Electronic instructions for use (eIFU)', description: 'If providing eIFU, demonstrate compliance with applicable regulatory requirements for electronic delivery.', sectionGroup: 7, sectionGroupName: 'Electronic IFU', type: 'evidence' },
  { section: '7.2', title: 'eIFU availability and accessibility', description: 'Ensure eIFU is available throughout the device lifetime and accessible to users in appropriate formats.', sectionGroup: 7, sectionGroupName: 'Electronic IFU', type: 'evidence' },
];

export const ISO_20417_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_20417_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
