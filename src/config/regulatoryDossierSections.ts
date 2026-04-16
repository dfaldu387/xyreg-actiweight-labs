/**
 * Multi-market Regulatory Dossier configuration.
 *
 * Sections are split into:
 * - COMMON CORE: market-agnostic evidence reusable across all markets
 * - MARKET MODULES: market-specific regulatory sections that appear
 *   dynamically based on the product's target markets
 *
 * Existing TF-x IDs are preserved for backward compatibility with
 * technical_file_document_links.
 */

import type { TFSubItem } from './technicalFileSections';

export type MarketModuleKey = 'EU_MDR' | 'US_FDA' | 'UK_UKCA' | 'APAC_TGA';

export interface DossierSection {
  /** Stable section ID — reuses TF-x for existing sections, MKT-xx for new */
  sectionId: string;
  title: string;
  description: string;
  /** 'common' = all markets, or an array of MarketModuleKey */
  marketScope: 'common' | MarketModuleKey[];
  subItems: TFSubItem[];
}

export interface MarketModule {
  key: MarketModuleKey;
  label: string;
  /** Human-friendly short name for pills */
  shortLabel: string;
  /** Market codes (from product.markets) that activate this module */
  matchCodes: string[];
  color: string;
}

// ─── Market Module Definitions ──────────────────────────────────────────────

export const MARKET_MODULES: MarketModule[] = [
  {
    key: 'EU_MDR',
    label: 'EU MDR Module',
    shortLabel: 'EU',
    matchCodes: ['EU', 'EU MDR', 'EUROPE', 'CE'],
    color: 'blue',
  },
  {
    key: 'US_FDA',
    label: 'US FDA Module',
    shortLabel: 'US',
    matchCodes: ['US', 'USA', 'FDA', 'US FDA'],
    color: 'red',
  },
  {
    key: 'UK_UKCA',
    label: 'UK UKCA Module',
    shortLabel: 'UK',
    matchCodes: ['UK', 'UKCA', 'GB', 'MHRA'],
    color: 'purple',
  },
  {
    key: 'APAC_TGA',
    label: 'APAC / TGA Module',
    shortLabel: 'APAC',
    matchCodes: ['AU', 'AUSTRALIA', 'TGA', 'APAC'],
    color: 'amber',
  },
];

/**
 * Resolve which market modules are active for a given product's market codes.
 */
export function getActiveModules(productMarketCodes: string[]): MarketModuleKey[] {
  const upper = productMarketCodes.map(c => c.toUpperCase());
  return MARKET_MODULES
    .filter(m => m.matchCodes.some(mc => upper.includes(mc)))
    .map(m => m.key);
}

// ─── Common Core Sections ───────────────────────────────────────────────────
// These map 1:1 with existing TF-1 through TF-9 (minus EU-specific parts).

export const COMMON_CORE_SECTIONS: DossierSection[] = [
  {
    sectionId: 'TF-1',
    title: 'Device Description & Specification',
    description: 'Device variants, accessories, intended purpose, principles of operation, and classification.',
    marketScope: 'common',
    subItems: [], // sub-items inherited from technicalFileSections.ts at runtime
  },
  {
    sectionId: 'TF-2',
    title: 'Information Supplied by Manufacturer',
    description: 'Labels, IFU, language translations, and packaging markings.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-3',
    title: 'Design & Manufacturing Information',
    description: 'Process descriptions, site info, suppliers, drawings, and bill of materials.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-5',
    title: 'Benefit-Risk Analysis & Risk Management',
    description: 'Risk management plan (ISO 14971), hazard identification, risk controls, and benefit-risk determination.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-6',
    title: 'Product Verification & Validation',
    description: 'Pre-clinical testing, biocompatibility, EMC, software V&V, sterilisation, shelf-life, and clinical evaluation.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-7',
    title: 'Risk Management',
    description: 'FMEA, risk/benefit analysis, production monitoring, and completeness review.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-8',
    title: 'Clinical Evidence',
    description: 'Clinical evaluation plan, literature search, CER, equivalence assessment, and PMCF.',
    marketScope: 'common',
    subItems: [],
  },
  {
    sectionId: 'TF-9',
    title: 'Post-Market Surveillance',
    description: 'PMS plan, PMCF plan, PSUR, vigilance, and trend reporting.',
    marketScope: 'common',
    subItems: [],
  },
];

// ─── EU MDR Module ──────────────────────────────────────────────────────────

export const EU_MDR_SECTIONS: DossierSection[] = [
  {
    sectionId: 'TF-0',
    title: 'EU Administrative',
    description: 'EU Declaration of Conformity, Notified Body certificates, EUDAMED, economic operators, PRRC.',
    marketScope: ['EU_MDR'],
    subItems: [], // inherited from technicalFileSections.ts
  },
  {
    sectionId: 'TF-4',
    title: 'EU GSPR Checklist',
    description: 'General Safety and Performance Requirements (Annex I) checklist with harmonised standards mapping.',
    marketScope: ['EU_MDR'],
    subItems: [], // inherited from technicalFileSections.ts
  },
];

// ─── US FDA Module ──────────────────────────────────────────────────────────

export const US_FDA_SECTIONS: DossierSection[] = [
  {
    sectionId: 'MKT-US-01',
    title: 'FDA Administrative',
    description: 'FDA establishment registration, device listing, and regulatory correspondence.',
    marketScope: ['US_FDA'],
    subItems: [
      {
        letter: 'a',
        description: 'FDA Establishment Registration',
        requirement: 'All domestic and foreign establishments that manufacture, prepare, propagate, compound, or process devices must register with FDA (21 CFR 807).',
        guidance: 'Provide FDA establishment registration number, registration confirmation, and evidence of annual renewal.',
        helpText: 'FDA Establishment Registration is required before marketing devices in the US. Foreign manufacturers must also designate a US Agent.',
      },
      {
        letter: 'b',
        description: 'Device Listing',
        requirement: 'Manufacturers must list all devices they market in the US with FDA (21 CFR 807 Subpart B).',
        guidance: 'Provide device listing numbers, product codes, and evidence of listing submission through FURLS/DRLM.',
        helpText: 'Device listing tells FDA what devices you market. Each device variant needs its own listing entry with the correct product code.',
      },
      {
        letter: 'c',
        description: 'US Agent Designation (foreign manufacturers)',
        requirement: 'Foreign establishments must designate a US Agent who can communicate with FDA on their behalf (21 CFR 807.40).',
        guidance: 'Document the US Agent name, contact details, and signed agreement.',
        helpText: 'The US Agent is the primary point of contact between a foreign manufacturer and FDA. They must be located in the US and available during business hours.',
      },
    ],
  },
  {
    sectionId: 'MKT-US-02',
    title: 'Predicate Device & Substantial Equivalence',
    description: 'Predicate device analysis, substantial equivalence determination, and comparison.',
    marketScope: ['US_FDA'],
    subItems: [
      {
        letter: 'a',
        description: 'Predicate Device Identification',
        requirement: 'Identify one or more legally marketed predicate devices for 510(k) comparison (21 CFR 807.87(f)).',
        guidance: 'Document the predicate device name, manufacturer, 510(k) number, product code, and classification. Explain why this predicate is appropriate.',
        helpText: 'The predicate is a legally marketed device to which you compare your device. Choose one with the same intended use and similar technological characteristics.',
      },
      {
        letter: 'b',
        description: 'Substantial Equivalence Comparison',
        requirement: 'Demonstrate that the device is substantially equivalent in intended use and technological characteristics to the predicate (21 CFR 807.87).',
        guidance: 'Provide a detailed comparison table covering intended use, design, materials, energy source, and performance specifications.',
        helpText: 'Substantial equivalence means your device has the same intended use and either the same or different technological characteristics that do not raise new safety/effectiveness questions.',
      },
      {
        letter: 'c',
        description: 'Performance Data Supporting SE',
        requirement: 'Performance testing data demonstrating substantial equivalence where technological differences exist.',
        guidance: 'Include bench testing, biocompatibility, and/or clinical data that addresses any differences from the predicate.',
        helpText: 'If your device differs technologically from the predicate, you must provide performance data showing these differences do not affect safety or effectiveness.',
      },
    ],
  },
  {
    sectionId: 'MKT-US-03',
    title: '510(k) Submission Summary',
    description: '510(k) summary or statement, indications for use, and executive summary.',
    marketScope: ['US_FDA'],
    subItems: [
      {
        letter: 'a',
        description: '510(k) Summary or Statement',
        requirement: 'A 510(k) summary (publicly available) or a 510(k) statement certifying data availability (21 CFR 807.92–93).',
        guidance: 'Choose either a 510(k) Summary (concise public document) or a 510(k) Statement (certifying data will be available upon request). Most submitters choose the Summary.',
        helpText: 'The 510(k) Summary becomes publicly available once cleared. It should be concise but comprehensive enough for others to understand the basis for SE.',
      },
      {
        letter: 'b',
        description: 'Indications for Use Statement',
        requirement: 'FDA Form 3881 — Indications for Use statement specifying the intended use, prescription/OTC status, and any limitations.',
        guidance: 'Complete FDA Form 3881 with the device name, indications, and whether the device is prescription or over-the-counter.',
        helpText: 'This form is a mandatory part of the 510(k) submission. Ensure indications match your predicate and your labelling.',
      },
      {
        letter: 'c',
        description: 'Executive Summary / eSTAR Cover',
        requirement: 'Concise executive summary for eSTAR electronic submission format.',
        guidance: 'Provide a high-level overview of the device, classification, predicate, and basis for SE determination.',
        helpText: 'The eSTAR format is now required for most 510(k) submissions. The executive summary provides FDA reviewers with a quick overview of your submission.',
      },
    ],
  },
];

// ─── UK UKCA Module ─────────────────────────────────────────────────────────

export const UK_UKCA_SECTIONS: DossierSection[] = [
  {
    sectionId: 'MKT-UK-01',
    title: 'UK Administrative',
    description: 'UKCA Declaration of Conformity, MHRA registration, UK Responsible Person.',
    marketScope: ['UK_UKCA'],
    subItems: [
      {
        letter: 'a',
        description: 'UKCA Declaration of Conformity',
        requirement: 'Manufacturers placing devices on the GB market must draw up a UKCA Declaration of Conformity (UK MDR 2002 as amended).',
        guidance: 'Include device identification, manufacturer details, UK Approved Body reference (if applicable), and signature. The format mirrors EU DoC but references UK legislation.',
        helpText: 'The UKCA DoC is the UK equivalent of the EU DoC. It declares conformity with UK regulations rather than EU MDR. Required for GB market access.',
      },
      {
        letter: 'b',
        description: 'MHRA Device Registration',
        requirement: 'All medical devices placed on the GB market must be registered with MHRA before being placed on the market.',
        guidance: 'Provide MHRA registration confirmation, device details submitted, and evidence of annual renewal.',
        helpText: 'MHRA registration is mandatory for GB market access. Devices must be registered before being placed on the market. Registration is separate from any EU/CE processes.',
      },
      {
        letter: 'c',
        description: 'UK Responsible Person (UKRP)',
        requirement: 'Manufacturers based outside the UK must appoint a UK Responsible Person to act on their behalf (UK MDR 2002 Reg. 58).',
        guidance: 'Document the UKRP name, UK address, contact details, and signed written mandate.',
        helpText: 'The UKRP is the UK equivalent of the EU Authorised Representative. They are legally responsible for the device on the GB market and must be based in the UK.',
      },
    ],
  },
  {
    sectionId: 'MKT-UK-02',
    title: 'UK Essential Requirements',
    description: 'Essential requirements checklist per UK MDR 2002 Schedule 1.',
    marketScope: ['UK_UKCA'],
    subItems: [
      {
        letter: 'a',
        description: 'Essential Requirements Checklist',
        requirement: 'Demonstration of conformity with the essential requirements set out in Schedule 1 of UK MDR 2002.',
        guidance: 'Complete an essential requirements checklist referencing UK MDR 2002. Leverage existing EU GSPR documentation where requirements overlap.',
        helpText: 'UK Essential Requirements currently mirror EU MDD essential requirements. Most of your EU documentation can be reused, but ensure UK-specific references and any divergences are addressed.',
      },
      {
        letter: 'b',
        description: 'UK Designated Standards',
        requirement: 'List of UK designated standards applied to demonstrate conformity with essential requirements.',
        guidance: 'Provide a table of BS/EN standards applied, noting any differences from EU harmonised standards.',
        helpText: 'UK designated standards largely mirror EU harmonised standards but are published separately. Check the MHRA designated standards list for the current UK versions.',
      },
    ],
  },
];

// ─── APAC / TGA Module ──────────────────────────────────────────────────────

export const APAC_TGA_SECTIONS: DossierSection[] = [
  {
    sectionId: 'MKT-AU-01',
    title: 'TGA Administrative',
    description: 'TGA conformity assessment, ARTG inclusion, Australian Sponsor.',
    marketScope: ['APAC_TGA'],
    subItems: [
      {
        letter: 'a',
        description: 'Australian Sponsor Details',
        requirement: 'Medical devices supplied in Australia must have an Australian Sponsor who is responsible for the device (Therapeutic Goods Act 1989).',
        guidance: 'Document the Australian Sponsor name, address, TGA client ID, and signed agreement.',
        helpText: 'The Australian Sponsor is legally responsible for the device on the Australian market. They must be an Australian resident or incorporated in Australia.',
      },
      {
        letter: 'b',
        description: 'ARTG Inclusion Application',
        requirement: 'Devices must be included in the Australian Register of Therapeutic Goods (ARTG) before supply (TG Act s41).',
        guidance: 'Provide evidence of ARTG application or inclusion, ARTG number, and device classification under TGA rules.',
        helpText: 'ARTG inclusion is mandatory for supplying devices in Australia. The application type depends on classification — Class I may use a notification pathway, while higher classes need conformity assessment.',
      },
      {
        letter: 'c',
        description: 'TGA Conformity Assessment Evidence',
        requirement: 'Evidence of conformity assessment appropriate to the device classification (TGA Essential Principles).',
        guidance: 'Provide TGA conformity assessment certificates or evidence of EU CE/UKCA recognition (where applicable under mutual recognition).',
        helpText: 'TGA accepts EU CE certificates for some device classes under transitional arrangements. Check current TGA guidance for which pathways allow leveraging existing EU/UK assessments.',
      },
    ],
  },
  {
    sectionId: 'MKT-AU-02',
    title: 'TGA Essential Principles',
    description: 'Essential Principles checklist per TGA regulatory framework.',
    marketScope: ['APAC_TGA'],
    subItems: [
      {
        letter: 'a',
        description: 'Essential Principles Checklist',
        requirement: 'Demonstration of conformity with TGA Essential Principles for safety and performance.',
        guidance: 'Complete the TGA Essential Principles checklist. Leverage existing EU GSPR or UK Essential Requirements documentation where applicable.',
        helpText: 'TGA Essential Principles are broadly aligned with EU GSPRs and international standards. Reuse your existing compliance evidence and note any Australia-specific requirements.',
      },
      {
        letter: 'b',
        description: 'Australian-Specific Labelling',
        requirement: 'Labelling must comply with TGA labelling requirements including Australian Sponsor details.',
        guidance: 'Include Australian Sponsor name and address on labelling, ARTG number (if required), and any TGA-specific symbols.',
        helpText: 'Australian labelling requirements largely align with international standards but require Australian Sponsor identification on the label.',
      },
    ],
  },
];

// ─── Aggregated helpers ─────────────────────────────────────────────────────

const ALL_MARKET_SECTIONS: Record<MarketModuleKey, DossierSection[]> = {
  EU_MDR: EU_MDR_SECTIONS,
  US_FDA: US_FDA_SECTIONS,
  UK_UKCA: UK_UKCA_SECTIONS,
  APAC_TGA: APAC_TGA_SECTIONS,
};

/**
 * Get all dossier sections relevant to the given active market modules.
 * Returns common core + matching market-specific sections.
 */
export function getDossierSections(activeModules: MarketModuleKey[]): DossierSection[] {
  const marketSections = activeModules.flatMap(key => ALL_MARKET_SECTIONS[key] || []);
  return [...COMMON_CORE_SECTIONS, ...marketSections];
}

/**
 * Get market-specific sections only (no common core).
 */
export function getMarketSections(moduleKey: MarketModuleKey): DossierSection[] {
  return ALL_MARKET_SECTIONS[moduleKey] || [];
}
