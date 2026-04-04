export interface IssuingAgency {
  code: string;
  name: string;
  fullName: string;
  description: string;
  bestFor: string[];
  prefixFormat: string;
  prefixExample: string;
  websiteUrl: string;
  registrationUrl?: string;
}

export const ISSUING_AGENCIES: IssuingAgency[] = [
  {
    code: 'GS1',
    name: 'GS1',
    fullName: 'GS1 Global',
    description: 'Most common worldwide standard for UDI',
    bestFor: ['General medical devices', 'Retail distribution', 'Global markets'],
    prefixFormat: 'Company Prefix (6-12 digits)',
    prefixExample: '123456789012',
    websiteUrl: 'https://www.gs1.org',
    registrationUrl: 'https://www.gs1.org'
  },
  {
    code: 'HIBCC',
    name: 'HIBCC',
    fullName: 'Health Industry Business Communications Council',
    description: 'Healthcare industry standard',
    bestFor: ['US hospital systems', 'Alphanumeric codes needed', 'Healthcare-specific'],
    prefixFormat: 'Labeler Identification Code (LIC)',
    prefixExample: 'A123BJC5D6E71',
    websiteUrl: 'https://www.hibcc.org',
    registrationUrl: 'https://www.hibcc.org'
  },
  {
    code: 'ICCBBA',
    name: 'ICCBBA',
    fullName: 'International Council for Commonality in Blood Banking Automation',
    description: 'Blood banking and transfusion medicine',
    bestFor: ['Blood products', 'Tissue products', 'Cellular therapy'],
    prefixFormat: 'Facility Identifier',
    prefixExample: 'W009400001',
    websiteUrl: 'https://www.iccbba.org',
    registrationUrl: 'https://www.iccbba.org'
  },
  {
    code: 'IFA',
    name: 'IFA',
    fullName: 'Informationsstelle für Arzneispezialitäten',
    description: 'German pharmaceutical identification (PZN)',
    bestFor: ['German pharmacy products', 'PZN-based identification'],
    prefixFormat: 'PZN Prefix',
    prefixExample: '12345678',
    websiteUrl: 'https://www.ifaffm.de',
    registrationUrl: 'https://www.ifaffm.de'
  },
  {
    code: 'EUDAMED',
    name: 'EUDAMED',
    fullName: 'EUDAMED-Allocated Identifier',
    description: 'European database allocation for legacy/directive devices',
    bestFor: ['Legacy devices', 'MDD/AIMDD directive devices', 'No external agency registration'],
    prefixFormat: 'SRN-based Identifier (e.g., FIMF000003986)',
    prefixExample: 'FIMF000003986',
    websiteUrl: 'https://ec.europa.eu/tools/eudamed',
    registrationUrl: 'https://ec.europa.eu/tools/eudamed'
  }
];

// Map EUDAMED issuing agency values to our dropdown codes
export const EUDAMED_AGENCY_MAPPING: Record<string, string> = {
  'GS1': 'GS1',
  'gs1': 'GS1',
  'GS1 Global': 'GS1',
  'gs1 global': 'GS1',
  'HIBCC': 'HIBCC',
  'hibcc': 'HIBCC', 
  'ICCBBA': 'ICCBBA',
  'iccbba': 'ICCBBA',
  'IFA': 'IFA',
  'ifa': 'IFA',
  'EUDAMED': 'EUDAMED',
  'eudamed': 'EUDAMED',
  'Eudamed': 'EUDAMED'
};

/**
 * Auto-detect issuing agency from a UDI-DI or Basic UDI-DI code pattern.
 * Returns the agency code or null if unknown.
 */
export function detectIssuingAgencyFromUDI(code: string): string | null {
  if (!code || !code.trim()) return null;
  const trimmed = code.trim();

  // EUDAMED-allocated: B- or D- prefix
  if (/^[BD]-/i.test(trimmed)) return 'EUDAMED';

  // HIBCC: starts with + or ++
  if (trimmed.startsWith('+')) return 'HIBCC';

  // ICCBBA: starts with =
  if (trimmed.startsWith('=')) return 'ICCBBA';

  // GS1: starts with (01) or is all-numeric (GTIN)
  if (trimmed.startsWith('(01)') || /^\d{12,14}$/.test(trimmed)) return 'GS1';

  // IFA: starts with PZN
  if (/^PZN/i.test(trimmed)) return 'IFA';

  return null;
}
