import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const PMDA_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device under Japanese PMD Act classes (I–IV) and determine the appropriate approval pathway.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '2', title: 'Marketing authorization holder (MAH)', description: 'Designate a Marketing Authorization Holder (MAH) in Japan or appoint an in-country representative (D-MAH).', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '3', title: 'Pre-market approval/certification/notification', description: 'Submit Shonin (approval), Ninsho (certification), or Todokede (notification) application as appropriate for device class.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
  { section: '4', title: 'QMS compliance (MHLW Ordinance 169)', description: 'Demonstrate QMS compliance per MHLW Ministerial Ordinance No. 169 and obtain QMS audit results.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Essential principles / technical standards', description: 'Demonstrate conformity with Japanese essential principles (based on GHTF/IMDRF) or applicable JIS standards.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Clinical evaluation / clinical trial data', description: 'Provide clinical evaluation or clinical trial (Chiken) data to support safety and efficacy claims.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Japanese labelling requirements', description: 'Ensure labelling in Japanese language meeting PMD Act requirements including manufacturer, intended purpose, warnings.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Post-market surveillance and adverse event reporting', description: 'Establish post-market surveillance including adverse event reporting to PMDA and periodic safety updates.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '9', title: 'Foreign manufacturer registration (FMR)', description: 'Register as a Foreign Manufacturer with PMDA if manufacturing outside Japan.', sectionGroup: 1, sectionGroupName: 'Classification & Approval', type: 'evidence' },
];

export const PMDA_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  PMDA_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
