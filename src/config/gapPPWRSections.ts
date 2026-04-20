import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const PPWR_SECTIONS: GenericSectionItem[] = [
  // Group 1: General Obligations & Substances
  { section: 'PPWR-1.1', title: 'Producer Role Definition', description: 'Define and document the economic operator role (producer, manufacturer, importer, distributor) under PPWR for each packaging type placed on the EU market.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.2', title: 'PFAS Restrictions Compliance', description: 'Verify that no packaging or packaging component contains intentionally added per- and polyfluoroalkyl substances (PFAS) above threshold concentrations.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.3', title: 'Heavy Metals Compliance', description: 'Confirm lead, cadmium, mercury, and hexavalent chromium concentrations in packaging materials do not exceed 100 ppm (sum of four metals).', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.4', title: 'Substances of Concern Assessment', description: 'Assess all packaging components for substances of concern (SVHC under REACH, CMR substances) and document findings.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.5', title: 'Manufacturer Identification on Packaging', description: 'Ensure manufacturer name, trade name or trademark, and contact address are displayed on the packaging.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.6', title: 'Packaging Minimisation', description: 'Document justification that packaging weight, volume, and empty space are minimised to the minimum adequate amount.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.7', title: 'Technical Documentation for Packaging', description: 'Prepare and maintain technical documentation demonstrating conformity with PPWR requirements for 10 years.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.8', title: 'Conformity Assessment Procedure', description: 'Complete the conformity assessment procedure (Module A) and draw up the EU declaration of conformity for packaging.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.9', title: 'Economic Operator Obligations', description: 'Ensure all economic operators in the supply chain comply with their respective PPWR obligations.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },
  { section: 'PPWR-1.10', title: 'Packaging Waste Prevention Plan', description: 'Establish a waste prevention plan covering packaging reduction targets.', sectionGroup: 1, sectionGroupName: 'General Obligations & Substances', type: 'evidence' },

  // Group 2: Labelling & Consumer Information
  { section: 'PPWR-2.1', title: 'Harmonised Sorting Labels', description: 'Apply harmonised sorting labels on all packaging units using delegated act symbols.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.2', title: 'Recycling Symbols', description: 'Display material-specific recycling symbols per harmonised EU standards.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.3', title: 'Material Identification Marking', description: 'Mark each packaging component with the applicable material identification code.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.4', title: 'Digital Labelling (QR Code)', description: 'Provide a QR code linking to material composition, recyclability, and reuse information.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.5', title: 'Consumer Information Requirements', description: 'Communicate disposal, sorting, and deposit-return scheme information to end-consumers.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.6', title: 'Collection Instructions', description: 'Provide clear separate collection instructions for each packaging component.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.7', title: 'Reuse Labelling', description: 'Apply harmonised reuse label for reusable packaging.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },
  { section: 'PPWR-2.8', title: 'Composite Packaging Marking', description: 'Identify each separable material layer in composite packaging.', sectionGroup: 2, sectionGroupName: 'Labelling & Consumer Information', type: 'evidence' },

  // Group 3: Recyclability & Sustainability
  { section: 'PPWR-3.1', title: 'Design for Recycling Assessment', description: 'Assess packaging against DfR criteria and assign a recyclability grade (A/B/C).', sectionGroup: 3, sectionGroupName: 'Recyclability & Sustainability', type: 'evidence' },
  { section: 'PPWR-3.2', title: 'Recycled Content Targets', description: 'Document recycled content percentages and compliance with applicable targets.', sectionGroup: 3, sectionGroupName: 'Recyclability & Sustainability', type: 'evidence' },
  { section: 'PPWR-3.3', title: 'Compostability Assessment', description: 'If applicable, assess compostability of packaging against EN 13432.', sectionGroup: 3, sectionGroupName: 'Recyclability & Sustainability', type: 'evidence' },

  // Group 4: EPR & Reporting
  { section: 'PPWR-4.1', title: 'EPR Registration', description: 'Register with Extended Producer Responsibility (EPR) scheme in each EU Member State where packaging is placed on the market.', sectionGroup: 4, sectionGroupName: 'EPR & Reporting', type: 'evidence' },
  { section: 'PPWR-4.2', title: 'Reporting Obligations', description: 'Submit packaging data reports (volume, materials, recyclability) to national authorities.', sectionGroup: 4, sectionGroupName: 'EPR & Reporting', type: 'evidence' },
  { section: 'PPWR-4.3', title: 'Digital Product Passport Readiness', description: 'Prepare for digital product passport requirements for packaging traceability.', sectionGroup: 4, sectionGroupName: 'EPR & Reporting', type: 'evidence' },
];

export const PPWR_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  PPWR_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
