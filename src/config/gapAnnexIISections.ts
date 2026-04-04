/**
 * MDR Annex II section/route configuration.
 * Maps the full Annex II gap analysis hierarchy to:
 * - A section group (for visual grouping)
 * - Sub-items (lettered requirements shown on detail pages)
 *
 * All sections use in-system guided forms (like IEC 60601-1).
 */

export interface AnnexIISubItem {
  /** Letter label, e.g. "a", "b" */
  letter: string;
  /** Short description of the requirement */
  description: string;
}

export interface AnnexIISectionItem {
  /** The section number as displayed (e.g. "1.1", "6.2") */
  section: string;
  /** Human-readable title */
  title: string;
  /** Integer group for visual grouping (items with same group render under same header) */
  sectionGroup: number;
  /** Group header name */
  sectionGroupName: string;
  /** Interaction type — always 'evidence' (in-system form) */
  type: 'evidence';
  /** Icon hint for the sidebar */
  iconHint: 'device' | 'design' | 'regulatory' | 'risk' | 'clinical' | 'evidence';
  /** Lettered sub-requirements shown on the detail page */
  subItems?: AnnexIISubItem[];
}

/**
 * Ordered list of Annex II items matching the MDR document structure.
 * The `section` field here matches the `section` column in `gap_analysis_items`.
 */
export const ANNEX_II_SECTIONS: AnnexIISectionItem[] = [
  {
    section: '1.1',
    title: 'Device Description and Specification',
    sectionGroup: 1,
    sectionGroupName: 'Device Description',
    type: 'evidence',
    iconHint: 'device',
    subItems: [
      { letter: 'a', description: 'Product/trade name and general description of the device' },
      { letter: 'a2', description: 'Intended purpose' },
      { letter: 'a3', description: 'Intended users' },
      { letter: 'b', description: 'Basic UDI-DI as referred to in Part C of Annex VI' },
      { letter: 'c', description: 'Intended patient population, medical conditions, indications, contra-indications, warnings' },
      { letter: 'd', description: 'Principles of operation and mode of action' },
      { letter: 'e', description: 'Rationale for the qualification of the product as a device' },
      { letter: 'f', description: 'Risk class and justification for classification rule(s) applied (Annex VIII)' },
      { letter: 'g', description: 'Explanation of any novel features' },
      { letter: 'h', description: 'Accessories, other devices and other products intended to be used in combination' },
      { letter: 'i', description: 'Configurations/variants intended to be made available on the market' },
      { letter: 'j', description: 'Key functional elements (parts, components, software, formulation, composition)' },
      { letter: 'k', description: 'Raw materials incorporated into key functional elements and those in contact with the human body' },
      { letter: 'l', description: 'Technical specifications (features, dimensions, performance attributes)' },
    ],
  },
  {
    section: '1.2',
    title: 'Reference to Previous and Similar Generations',
    sectionGroup: 1,
    sectionGroupName: 'Device Description',
    type: 'evidence',
    iconHint: 'evidence',
  },
  {
    section: '2',
    title: 'Information Supplied by the Manufacturer',
    sectionGroup: 2,
    sectionGroupName: 'Information Supplied',
    type: 'evidence',
    iconHint: 'evidence',
  },
  {
    section: '3.1',
    title: 'Design Information',
    sectionGroup: 3,
    sectionGroupName: 'Design & Manufacturing',
    type: 'evidence',
    iconHint: 'design',
  },
  {
    section: '3.2',
    title: 'Manufacturing Information',
    sectionGroup: 3,
    sectionGroupName: 'Design & Manufacturing',
    type: 'evidence',
    iconHint: 'design',
    subItems: [
      { letter: 'a', description: 'Manufacturing processes (flowcharts, sterilization, assembly, testing)' },
      { letter: 'b', description: 'Identification of all sites, including suppliers and sub-contractors' },
    ],
  },
  {
    section: '4',
    title: 'General Safety and Performance Requirements',
    sectionGroup: 4,
    sectionGroupName: 'GSPR',
    type: 'evidence',
    iconHint: 'regulatory',
    subItems: [
      { letter: 'a', description: 'The GSPRs that apply and explanation of why others do not apply' },
      { letter: 'b', description: 'Method(s) used to demonstrate conformity with each applicable GSPR' },
      { letter: 'c', description: 'Harmonised standards, CS, or other solutions applied' },
      { letter: 'd', description: 'Precise identity of controlled documents offering evidence' },
    ],
  },
  {
    section: '5',
    title: 'Benefit-Risk Analysis and Risk Management',
    sectionGroup: 5,
    sectionGroupName: 'Risk Management',
    type: 'evidence',
    iconHint: 'risk',
    subItems: [
      { letter: 'a', description: 'The benefit-risk analysis (Section 1 and 8 of Annex I)' },
      { letter: 'b', description: 'Solutions adopted and results of the risk management (Section 3 of Annex I)' },
    ],
  },
  {
    section: '6.1',
    title: 'Pre-clinical and Clinical Data',
    sectionGroup: 6,
    sectionGroupName: 'Product Verification & Validation',
    type: 'evidence',
    iconHint: 'clinical',
    subItems: [
      { letter: 'a', description: 'Results of tests (biocompatibility, physical, chemical, electrical safety)' },
      { letter: 'b', description: 'Sterilization validation and shelf-life testing' },
      { letter: 'c', description: 'Software verification and validation' },
      { letter: 'd', description: 'Clinical evaluation report and its updates (Annex XIV Part A)' },
      { letter: 'e', description: 'PMCF plan and evaluation report' },
    ],
  },
  {
    section: '6.2',
    title: 'Additional Information in Specific Cases',
    sectionGroup: 6,
    sectionGroupName: 'Product Verification & Validation',
    type: 'evidence',
    iconHint: 'clinical',
    subItems: [
      { letter: 'a', description: 'Devices incorporating a medicinal substance' },
      { letter: 'b', description: 'Devices manufactured utilizing tissues or cells of human or animal origin' },
      { letter: 'c', description: 'Devices containing CMR or endocrine-disrupting substances' },
      { letter: 'd', description: 'Devices composed of substances absorbed by or locally dispersed in the body' },
      { letter: 'e', description: 'Devices with a measuring function' },
      { letter: 'f', description: 'Devices connected to other devices' },
    ],
  },
  {
    section: '7',
    title: 'Post-Market Surveillance',
    sectionGroup: 7,
    sectionGroupName: 'Post-Market',
    type: 'evidence',
    iconHint: 'evidence',
  },
];

/** Unique section groups in order */
export const ANNEX_II_GROUPS = (() => {
  const seen = new Map<number, string>();
  ANNEX_II_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) {
      seen.set(s.sectionGroup, s.sectionGroupName);
    }
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();

/** Find the config entry matching a gap item's section field */
export function findAnnexIIConfig(section: string): AnnexIISectionItem | undefined {
  return ANNEX_II_SECTIONS.find(s => s.section === section);
}
