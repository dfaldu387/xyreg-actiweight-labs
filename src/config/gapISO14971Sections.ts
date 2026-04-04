import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

// Enterprise-level clauses only (3.1–3.3): organizational process, responsibilities, personnel
export const ISO_14971_ENTERPRISE_SECTIONS: GenericSectionItem[] = [
  { section: '3.1', title: 'Risk management process', description: 'Define and document the organization-wide risk management process, including criteria for risk acceptability and policy for determining acceptable risk.', sectionGroup: 3, sectionGroupName: 'General Requirements for Risk Management', type: 'evidence' },
  { section: '3.2', title: 'Management responsibilities', description: 'Demonstrate top management commitment to risk management: define policy, ensure adequate resources, and assign qualified personnel.', sectionGroup: 3, sectionGroupName: 'General Requirements for Risk Management', type: 'evidence' },
  { section: '3.3', title: 'Qualification of personnel', description: 'Ensure personnel performing risk management activities have the required knowledge, experience, and training. Maintain competency records.', sectionGroup: 3, sectionGroupName: 'General Requirements for Risk Management', type: 'evidence' },
];

export const ISO_14971_ENTERPRISE_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ISO_14971_ENTERPRISE_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();

// Backward-compatible aliases (deprecated — prefer explicit ENTERPRISE names)
export const ISO_14971_SECTIONS = ISO_14971_ENTERPRISE_SECTIONS;
export const ISO_14971_GROUPS = ISO_14971_ENTERPRISE_GROUPS;
