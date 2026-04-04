import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const KFDA_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per MFDS classification rules (Class 1–4) based on intended use and risk level.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '2', title: 'Licensing / approval pathway', description: 'Determine the appropriate pathway: notification (Class 1), certification (Class 2), or approval (Class 3–4) with MFDS.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '3', title: 'Korean authorized representative', description: 'Appoint a Korean License Holder (KLH) or authorized representative for foreign manufacturers.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '4', title: 'Technical documentation (KGMP)', description: 'Prepare technical documentation per KGMP (Korean Good Manufacturing Practice) requirements.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'GMP compliance (KGMP)', description: 'Demonstrate GMP compliance per KGMP requirements. Obtain GMP audit results from MFDS or recognized body.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Product testing at MFDS-recognized labs', description: 'Complete product testing at MFDS-recognized testing laboratories per applicable Korean standards.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Clinical evaluation / clinical trial', description: 'Provide clinical data or conduct clinical trials per MFDS requirements for Class 3–4 and novel devices.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '8', title: 'Korean labelling requirements', description: 'Ensure labelling in Korean language meeting MFDS requirements including manufacturer, intended use, and warnings.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'Post-market surveillance and adverse event reporting', description: 'Establish adverse event reporting and post-market surveillance system per MFDS requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
];

export const KFDA_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  KFDA_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
