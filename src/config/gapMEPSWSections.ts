import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const MEPSW_SECTIONS: GenericSectionItem[] = [
  { section: '1', title: 'Device classification', description: 'Classify the device per Swiss MepV classification rules aligned with EU MDR risk classes (I, IIa, IIb, III).', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '2', title: 'Swiss Authorized Representative (CH-REP)', description: 'Appoint a Swiss Authorized Representative for devices placed on the Swiss market by foreign manufacturers.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '3', title: 'Swissmedic registration', description: 'Register the device and economic operators with Swissmedic before placing the device on the Swiss market.', sectionGroup: 1, sectionGroupName: 'Classification & Registration', type: 'evidence' },
  { section: '4', title: 'Conformity assessment (MepV)', description: 'Complete conformity assessment procedures per MepV using an EU Notified Body or Swiss Designated Body.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '5', title: 'Essential requirements compliance', description: 'Demonstrate compliance with general safety and performance requirements aligned with EU MDR Annex I.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '6', title: 'Technical documentation', description: 'Maintain technical documentation per MepV requirements, available for Swissmedic review.', sectionGroup: 2, sectionGroupName: 'Technical Requirements', type: 'evidence' },
  { section: '7', title: 'Labelling — Swiss requirements', description: 'Ensure labelling meets Swiss requirements including CH-REP details, language requirements (DE/FR/IT), and applicable conformity marks.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
  { section: '8', title: 'Post-market surveillance and vigilance', description: 'Establish post-market surveillance and vigilance reporting to Swissmedic per MepV requirements.', sectionGroup: 3, sectionGroupName: 'Labelling & Post-Market', type: 'evidence' },
];

export const MEPSW_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  MEPSW_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
