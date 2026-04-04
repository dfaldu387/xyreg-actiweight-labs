export interface EUCountryCodeType {
  code: string;
  name: string;
  description: string;
}

export interface EUCountrySystem {
  country: string;
  countryCode: string;
  flagEmoji: string;
  systems: {
    name: string;
    codeTypes: EUCountryCodeType[];
  }[];
  htaBody: {
    name: string;
    url: string;
  };
  description: string;
  hasDeepDive: boolean;
}

export const EU_COUNTRY_REIMBURSEMENT_SYSTEMS: Record<string, EUCountrySystem> = {
  DE: {
    country: 'Germany',
    countryCode: 'DE',
    flagEmoji: '🇩🇪',
    description: 'Dual hospital/outpatient system with NUB process for innovations and mandatory G-BA assessment for high-risk devices',
    systems: [
      {
        name: 'Hospital Inpatient Codes',
        codeTypes: [
          { code: 'OPS', name: 'Procedure Codes', description: 'German procedure classification system (Operationen- und Prozedurenschlüssel)' },
          { code: 'G-DRG', name: 'Diagnosis Related Groups', description: 'German DRG system for hospital reimbursement' },
          { code: 'NUB', name: 'New Methods Application', description: 'Temporary additional funding for innovative methods (Neue Untersuchungs- und Behandlungsmethoden)' }
        ]
      },
      {
        name: 'Outpatient Codes',
        codeTypes: [
          { code: 'EBM', name: 'Uniform Assessment Standard', description: 'Physician services fee schedule (Einheitlicher Bewertungsmaßstab)' },
          { code: 'HiMi', name: 'Medical Aids Directory', description: 'Reimbursable medical aids list (Hilfsmittelverzeichnis)' }
        ]
      }
    ],
    htaBody: {
      name: 'G-BA (Gemeinsamer Bundesausschuss) & IQWiG',
      url: 'https://www.g-ba.de/'
    },
    hasDeepDive: true
  },
  FR: {
    country: 'France',
    countryCode: 'FR',
    flagEmoji: '🇫🇷',
    description: 'Central HAS evaluation with LPP listing for reimbursable medical devices and procedure-based reimbursement',
    systems: [
      {
        name: 'Procedure & Device Codes',
        codeTypes: [
          { code: 'CCAM', name: 'Medical Acts Classification', description: 'Classification Commune des Actes Médicaux - procedure coding system' },
          { code: 'LPP', name: 'Product & Services List', description: 'Liste des Produits et Prestations - reimbursable medical devices and services' },
          { code: 'GHS', name: 'Homogeneous Stay Groups', description: 'Groupes Homogènes de Séjours - French DRG system for hospital stays' }
        ]
      }
    ],
    htaBody: {
      name: 'HAS (Haute Autorité de Santé)',
      url: 'https://www.has-sante.fr/'
    },
    hasDeepDive: true
  },
  IT: {
    country: 'Italy',
    countryCode: 'IT',
    flagEmoji: '🇮🇹',
    description: 'Regional health systems with national DRG framework and device classification by innovation level',
    systems: [
      {
        name: 'National Framework',
        codeTypes: [
          { code: 'DRG Nazionale', name: 'National DRG System', description: 'National diagnosis-related groups for hospital reimbursement' },
          { code: 'CND', name: 'Device Classification', description: 'Classificazione Nazionale dei Dispositivi medici' },
          { code: 'Nomenclatore', name: 'Tariff Nomenclature', description: 'National reimbursement tariff system for medical devices' }
        ]
      },
      {
        name: 'Regional Systems',
        codeTypes: [
          { code: 'Regional DRG', name: 'Regional Variations', description: 'Region-specific DRG modifications and supplements' }
        ]
      }
    ],
    htaBody: {
      name: 'AIFA (Agenzia Italiana del Farmaco) & Regional Health Authorities',
      url: 'https://www.aifa.gov.it/'
    },
    hasDeepDive: false
  },
  ES: {
    country: 'Spain',
    countryCode: 'ES',
    flagEmoji: '🇪🇸',
    description: 'Decentralized system with autonomous regional control over device procurement and reimbursement',
    systems: [
      {
        name: 'National System',
        codeTypes: [
          { code: 'SNS', name: 'National Health System', description: 'Sistema Nacional de Salud - basic national framework' },
          { code: 'AP-DRG', name: 'Spanish DRG', description: 'All Patient DRG system adapted for Spain' },
          { code: 'CIE-10', name: 'Procedure Codes', description: 'Spanish adaptation of ICD-10 procedure codes' }
        ]
      },
      {
        name: 'Regional Systems',
        codeTypes: [
          { code: 'CCAA', name: 'Autonomous Communities', description: 'Each region (Comunidades Autónomas) has procurement authority' }
        ]
      }
    ],
    htaBody: {
      name: 'AEMPS (Agencia Española de Medicamentos) & Regional Health Departments',
      url: 'https://www.aemps.gob.es/'
    },
    hasDeepDive: false
  },
  NL: {
    country: 'Netherlands',
    countryCode: 'NL',
    flagEmoji: '🇳🇱',
    description: 'DBC-based system with managed competition and health insurer negotiations',
    systems: [
      {
        name: 'Healthcare Products',
        codeTypes: [
          { code: 'DBC', name: 'Diagnosis Treatment Combinations', description: 'Diagnose Behandel Combinatie - bundled payment system' },
          { code: 'ZVW', name: 'Health Insurance Act', description: 'Zorgverzekeringswet - basic insurance package framework' },
          { code: 'AO', name: 'Add-On Funding', description: 'Separate reimbursement for expensive devices (Add-Ons)' }
        ]
      }
    ],
    htaBody: {
      name: 'Zorginstituut Nederland (ZIN) & NZa',
      url: 'https://www.zorginstituutnederland.nl/'
    },
    hasDeepDive: false
  },
  BE: {
    country: 'Belgium',
    countryCode: 'BE',
    flagEmoji: '🇧🇪',
    description: 'INAMI/RIZIV nomenclature system with technology-specific reimbursement pathways',
    systems: [
      {
        name: 'National Nomenclature',
        codeTypes: [
          { code: 'INAMI/RIZIV', name: 'National Nomenclature', description: 'Belgian social security medical act nomenclature' },
          { code: 'APR-DRG', name: 'Belgian DRG', description: 'All Patient Refined DRG system for hospital financing' },
          { code: 'Article 35bis', name: 'Innovation Funding', description: 'Temporary reimbursement for innovative technologies' }
        ]
      }
    ],
    htaBody: {
      name: 'INAMI/RIZIV & KCE (Belgian Health Care Knowledge Centre)',
      url: 'https://www.inami.fgov.be/'
    },
    hasDeepDive: false
  },
  AT: {
    country: 'Austria',
    countryCode: 'AT',
    flagEmoji: '🇦🇹',
    description: 'LKF point system for hospital financing with federal-regional coordination',
    systems: [
      {
        name: 'Hospital Financing',
        codeTypes: [
          { code: 'LKF', name: 'Performance-Oriented Financing', description: 'Leistungsorientierte Krankenanstaltenfinanzierung - Austrian DRG-like system' },
          { code: 'MEL', name: 'Medical Device Catalog', description: 'Medizinprodukte-Evidenz-Liste' },
          { code: 'EKO', name: 'Outpatient Tariffs', description: 'Erstattungskodex - outpatient reimbursement framework' }
        ]
      }
    ],
    htaBody: {
      name: 'HVB (Hauptverband) & AGES (Austrian Agency for Health)',
      url: 'https://www.sozialversicherung.at/'
    },
    hasDeepDive: false
  },
  PL: {
    country: 'Poland',
    countryCode: 'PL',
    flagEmoji: '🇵🇱',
    description: 'JGP group system with NFZ central purchasing and health technology assessment',
    systems: [
      {
        name: 'National Health Fund',
        codeTypes: [
          { code: 'JGP', name: 'Polish DRG', description: 'Jednorodne Grupy Pacjentów - homogeneous patient groups' },
          { code: 'ICD-9-CM', name: 'Procedure Codes', description: 'Polish adaptation of ICD-9-CM procedure classification' },
          { code: 'NFZ Catalog', name: 'Reimbursement Catalog', description: 'National Health Fund device reimbursement list' }
        ]
      }
    ],
    htaBody: {
      name: 'AOTMiT (Agency for Health Technology Assessment)',
      url: 'https://www.aotm.gov.pl/'
    },
    hasDeepDive: false
  },
  SE: {
    country: 'Sweden',
    countryCode: 'SE',
    flagEmoji: '🇸🇪',
    description: 'NordDRG system with regional procurement through county councils',
    systems: [
      {
        name: 'Nordic System',
        codeTypes: [
          { code: 'NordDRG', name: 'Nordic DRG', description: 'Shared DRG system across Nordic countries' },
          { code: 'KVÅ', name: 'Procedure Codes', description: 'Klassifikation av vårdåtgärder - Swedish procedure classification' },
          { code: 'TLV', name: 'Reimbursement List', description: 'Tandvårds- och läkemedelsförmånsverket pricing decisions' }
        ]
      }
    ],
    htaBody: {
      name: 'TLV (Dental and Pharmaceutical Benefits Agency) & Regional Councils',
      url: 'https://www.tlv.se/'
    },
    hasDeepDive: false
  }
};

export const EU_OVERVIEW = {
  title: 'EU Reimbursement Landscape',
  description: 'Unlike the centralized US system, the European Union does not have a single unified reimbursement framework. Each EU member state operates its own national healthcare system with distinct reimbursement codes, HTA processes, and pricing mechanisms. Understanding country-specific requirements is essential for successful EU market entry.',
  keyPrinciples: [
    'National sovereignty: Each EU country controls its own healthcare budget and reimbursement decisions',
    'HTA variation: Health Technology Assessment requirements and timelines differ significantly by country',
    'Pricing diversity: Device pricing and reimbursement rates are negotiated at the national or regional level',
    'CE marking is NOT reimbursement: EU regulatory approval (CE Mark) does not guarantee reimbursement',
    'Regional differences: Some countries (Germany, Spain, Italy) have additional regional/federal variations'
  ]
};
