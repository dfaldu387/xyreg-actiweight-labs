// Market-specific reimbursement system metadata

export interface ReimbursementSystem {
  code: string;
  name: string;
  description: string;
  codeTypes: {
    code: string;
    name: string;
    description: string;
  }[];
  governingBody: string;
  applicationProcess?: string;
  typicalTimeline?: string;
  resources: {
    name: string;
    url: string;
  }[];
}

export const MARKET_REIMBURSEMENT_SYSTEMS: Record<string, ReimbursementSystem> = {
  'US': {
    code: 'US',
    name: 'United States',
    description: 'The US healthcare reimbursement system is a complex multi-payer environment including Medicare (federal program for 65+), Medicaid (state programs for low-income), and private commercial insurers. Medical devices require specific billing codes (CPT, HCPCS) and often need coverage determinations before payers will reimburse.',
    codeTypes: [
      {
        code: 'CPT',
        name: 'Current Procedural Terminology',
        description: 'AMA-maintained codes for physician services and procedures. Category I codes are established procedures, Category II for performance measures, Category III for emerging technology (temporary codes valid for 5 years). Medical device companies typically pursue Category III codes first for new technologies.'
      },
      {
        code: 'HCPCS Level II',
        name: 'Healthcare Common Procedure Coding System',
        description: 'CMS-managed alphanumeric codes (A0000-V9999) for supplies, equipment, DME, prosthetics, and non-physician services. Key categories: A-codes (ambulance/transport), E-codes (DME), L-codes (orthotics/prosthetics), K-codes (temporary). Critical for device-specific reimbursement separate from procedure codes.'
      },
      {
        code: 'MS-DRG',
        name: 'Medicare Severity-Diagnosis Related Groups',
        description: 'Prospective payment groupings for hospital inpatient stays. Hospitals receive a fixed payment per DRG regardless of actual costs. New technologies may qualify for add-on payments (NTAP) if they demonstrate substantial clinical improvement.'
      },
      {
        code: 'APC',
        name: 'Ambulatory Payment Classifications',
        description: 'Outpatient prospective payment system groupings. Similar to DRGs but for hospital outpatient services. Pass-through payments available for new devices meeting cost thresholds.'
      },
      {
        code: 'ICD-10',
        name: 'International Classification of Diseases',
        description: 'Diagnosis codes (ICD-10-CM) and procedure codes (ICD-10-PCS) used to justify medical necessity and document procedures performed. Essential for claims processing and coverage determinations.'
      }
    ],
    governingBody: 'American Medical Association (CPT), Centers for Medicare & Medicaid Services (HCPCS/DRG/APC), State Medicaid Agencies',
    applicationProcess: 'CPT: Submit Category III code application to AMA CPT Editorial Panel (meets 3x/year). HCPCS: Submit coding request to CMS via HCPCS workgroup (quarterly meetings). Coverage: Submit NCD/LCD request to CMS or MAC. NTAP: Apply to CMS for new technology add-on payment during IPPS rulemaking cycle.',
    typicalTimeline: 'CPT Category III: 6-12 months; HCPCS: 6-12 months; NCD: 9-12 months; NTAP: 12-18 months (tied to fiscal year rulemaking)',
    resources: [
      { name: 'AMA CPT Application', url: 'https://www.ama-assn.org/practice-management/cpt/cpt-process-faq' },
      { name: 'CMS HCPCS Coding', url: 'https://www.cms.gov/Medicare/Coding/MedHCPCSGenInfo' },
      { name: 'Medicare Coverage Database', url: 'https://www.cms.gov/medicare-coverage-database' },
      { name: 'CMS NTAP Program', url: 'https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/AcuteInpatientPPS/newtech' },
      { name: 'Medicare Local Coverage (LCDs)', url: 'https://www.cms.gov/medicare-coverage-database/indexes/lcd-alphabetical-index.aspx' }
    ]
  },
  'EU': {
    code: 'COUNTRY_SPECIFIC',
    name: 'European Union',
    description: 'Country-specific systems; major markets include Germany (EBM/G-DRG), France (CCAM/GHS)',
    codeTypes: [
      {
        code: 'VARIES',
        name: 'National Reimbursement Codes',
        description: 'Varies by EU member state - refer to national HTA agencies'
      }
    ],
    governingBody: 'National HTA Bodies (e.g., G-BA in Germany, HAS in France)',
    applicationProcess: 'Varies by country - typically requires health economic dossier',
    typicalTimeline: '12-36 months depending on country and device classification',
    resources: [
      { name: 'EUnetHTA', url: 'https://www.eunethta.eu/' },
      { name: 'MedtechEurope Reimbursement Guide', url: 'https://www.medtecheurope.org/' }
    ]
  },
  'DE': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Germany',
    description: 'Statutory Health Insurance system with EBM for outpatient and G-DRG for inpatient',
    codeTypes: [
      {
        code: 'EBM',
        name: 'Einheitlicher Bewertungsmaßstab',
        description: 'Uniform valuation standard for outpatient services'
      },
      {
        code: 'OPS',
        name: 'Operationen- und Prozedurenschlüssel',
        description: 'Classification system for procedures'
      },
      {
        code: 'G-DRG',
        name: 'German Diagnosis Related Groups',
        description: 'Hospital inpatient reimbursement'
      }
    ],
    governingBody: 'G-BA (Federal Joint Committee), InEK (DRG Institute)',
    applicationProcess: 'NUB (Neue Untersuchungs- und Behandlungsmethoden) process for new methods',
    typicalTimeline: '12-24 months for NUB approval',
    resources: [
      { name: 'G-BA', url: 'https://www.g-ba.de/' },
      { name: 'DIMDI (Classification Systems)', url: 'https://www.bfarm.de/DE/Kodiersysteme/_node.html' },
      { name: 'InEK (DRG)', url: 'https://www.g-drg.de/' }
    ]
  },
  'FR': {
    code: 'COUNTRY_SPECIFIC',
    name: 'France',
    description: 'National Health Insurance with CCAM for procedures and GHS for hospitalization',
    codeTypes: [
      {
        code: 'CCAM',
        name: 'Classification Commune des Actes Médicaux',
        description: 'Common classification of medical procedures'
      },
      {
        code: 'GHS',
        name: 'Groupes Homogènes de Séjours',
        description: 'Hospital stay reimbursement groups'
      },
      {
        code: 'LPP',
        name: 'Liste des Produits et Prestations',
        description: 'List of reimbursable medical devices and services'
      }
    ],
    governingBody: 'HAS (Haute Autorité de Santé), CEPS (Comité Économique des Produits de Santé)',
    applicationProcess: 'Inscription LPPR for medical devices; CNEDiMTS evaluation',
    typicalTimeline: '12-24 months for HAS evaluation and CEPS pricing',
    resources: [
      { name: 'HAS', url: 'https://www.has-sante.fr/' },
      { name: 'ATIH (CCAM/GHS)', url: 'https://www.atih.sante.fr/' },
      { name: 'Ameli (LPPR)', url: 'https://www.ameli.fr/' }
    ]
  },
  'UK': {
    code: 'UK',
    name: 'United Kingdom',
    description: 'NHS with OPCS-4 procedure codes and HRG tariff groupings',
    codeTypes: [
      {
        code: 'OPCS-4',
        name: 'Office of Population Censuses and Surveys Classification v4',
        description: 'UK procedure classification system'
      },
      {
        code: 'HRG',
        name: 'Healthcare Resource Groups',
        description: 'Payment groupings for NHS'
      }
    ],
    governingBody: 'NHS England, NICE (National Institute for Health and Care Excellence)',
    applicationProcess: 'NICE Medical Technologies Evaluation Programme (MTEP)',
    typicalTimeline: '12-18 months for NICE evaluation',
    resources: [
      { name: 'NHS Digital (OPCS-4)', url: 'https://digital.nhs.uk/services/terminology-and-classifications' },
      { name: 'NICE', url: 'https://www.nice.org.uk/' },
      { name: 'NHS England Pricing', url: 'https://www.england.nhs.uk/pay-syst/' }
    ]
  },
  'CA': {
    code: 'CA',
    name: 'Canada',
    description: 'Provincial systems with CCI for procedures and CMG for acute inpatient',
    codeTypes: [
      {
        code: 'CCI',
        name: 'Canadian Classification of Health Interventions',
        description: 'National procedure classification'
      },
      {
        code: 'CMG',
        name: 'Case Mix Groups',
        description: 'Patient grouping methodology for acute inpatient'
      }
    ],
    governingBody: 'CIHI (Canadian Institute for Health Information), Provincial Ministries',
    applicationProcess: 'Provincial submissions; CADTH for HTA review',
    typicalTimeline: '12-24 months including provincial negotiations',
    resources: [
      { name: 'CIHI', url: 'https://www.cihi.ca/' },
      { name: 'CADTH', url: 'https://www.cadth.ca/' }
    ]
  },
  'JP': {
    code: 'JP',
    name: 'Japan',
    description: 'Universal Health Insurance with procedure and material reimbursement codes',
    codeTypes: [
      {
        code: 'K-CODE',
        name: 'Surgical Procedure Codes',
        description: 'Reimbursement codes for surgical procedures'
      },
      {
        code: 'C-CODE',
    name: 'Medical Device Material Codes',
        description: 'Specific device reimbursement codes'
      }
    ],
    governingBody: 'MHLW (Ministry of Health, Labour and Welfare)',
    applicationProcess: 'Shonin Shinsei (approval application) followed by reimbursement application',
    typicalTimeline: '18-36 months including PMDA review and pricing',
    resources: [
      { name: 'PMDA', url: 'https://www.pmda.go.jp/english/' },
      { name: 'MHLW', url: 'https://www.mhlw.go.jp/english/' }
    ]
  },
  'AU': {
    code: 'AU',
    name: 'Australia',
    description: 'Medicare Benefits Schedule (MBS) for medical services and prostheses list',
    codeTypes: [
      {
        code: 'MBS',
        name: 'Medicare Benefits Schedule',
        description: 'Fee schedule for medical services'
      },
      {
        code: 'PROSTHESES',
        name: 'Prostheses List',
        description: 'List of reimbursable implantable devices'
      }
    ],
    governingBody: 'Department of Health, MSAC (Medical Services Advisory Committee)',
    applicationProcess: 'MSAC application for new MBS items; Prostheses List Application',
    typicalTimeline: '12-24 months for MSAC assessment',
    resources: [
      { name: 'MBS Online', url: 'http://www.mbsonline.gov.au/' },
      { name: 'MSAC', url: 'https://www.health.gov.au/committees-and-groups/msac' },
      { name: 'Prostheses List', url: 'https://www.health.gov.au/health-topics/private-health-insurance/the-prostheses-list' }
    ]
  },
  'BR': {
    code: 'BR',
    name: 'Brazil',
    description: 'SUS public system with SIGTAP procedure table',
    codeTypes: [
      {
        code: 'SIGTAP',
        name: 'Sistema de Gerenciamento da Tabela de Procedimentos',
        description: 'SUS procedure and device reimbursement table'
      }
    ],
    governingBody: 'CONITEC (National Commission for Health Technology Incorporation)',
    applicationProcess: 'CONITEC submission for SUS incorporation',
    typicalTimeline: '12-24 months for CONITEC evaluation',
    resources: [
      { name: 'CONITEC', url: 'http://conitec.gov.br/' },
      { name: 'SIGTAP', url: 'http://sigtap.datasus.gov.br/' }
    ]
  },
  'CN': {
    code: 'CN',
    name: 'China',
    description: 'National Reimbursement Drug List (NRDL) and provincial supplements',
    codeTypes: [
      {
        code: 'NRDL',
        name: 'National Reimbursement List',
        description: 'National list for medical services and devices'
      },
      {
        code: 'PROVINCIAL',
        name: 'Provincial Supplement Lists',
        description: 'Province-specific reimbursement additions'
      }
    ],
    governingBody: 'NHSA (National Healthcare Security Administration)',
    applicationProcess: 'NHSA application and provincial negotiations',
    typicalTimeline: '18-36 months including national and provincial approval',
    resources: [
      { name: 'NHSA', url: 'http://www.nhsa.gov.cn/' },
      { name: 'NMPA (Regulatory)', url: 'https://www.nmpa.gov.cn/eng/' }
    ]
  },
  'IN': {
    code: 'IN',
    name: 'India',
    description: 'Mix of government schemes (CGHS, PMJAY) and private insurance with varying codes',
    codeTypes: [
      {
        code: 'CGHS',
        name: 'Central Government Health Scheme',
        description: 'Federal employee health scheme codes'
      },
      {
        code: 'PMJAY',
        name: 'Ayushman Bharat Package Codes',
        description: 'National health protection scheme'
      }
    ],
    governingBody: 'National Health Authority, various state health departments',
    applicationProcess: 'Scheme-specific applications; state-level approvals',
    typicalTimeline: 'Varies significantly by scheme and state (12-36 months)',
    resources: [
      { name: 'National Health Authority', url: 'https://nha.gov.in/' },
      { name: 'CGHS', url: 'https://cghs.gov.in/' }
    ]
  },
  'KR': {
    code: 'KR',
    name: 'South Korea',
    description: 'National Health Insurance with procedure and material codes',
    codeTypes: [
      {
        code: 'EDI',
        name: 'Electronic Data Interchange Codes',
        description: 'National health insurance reimbursement codes'
      }
    ],
    governingBody: 'HIRA (Health Insurance Review & Assessment Service)',
    applicationProcess: 'New technology assessment through NECA, then HIRA pricing',
    typicalTimeline: '12-24 months for evaluation and listing',
    resources: [
      { name: 'HIRA', url: 'https://www.hira.or.kr/eng/' },
      { name: 'NECA', url: 'https://www.neca.re.kr/eng/' }
    ]
  },
  'CH': {
    code: 'CH',
    name: 'Switzerland',
    description: 'Swiss tariff structures (TARMED for outpatient, SwissDRG for inpatient)',
    codeTypes: [
      {
        code: 'TARMED',
        name: 'Tarif Médical',
        description: 'Outpatient medical tariff structure'
      },
      {
        code: 'SwissDRG',
        name: 'Swiss Diagnosis Related Groups',
        description: 'Inpatient hospital reimbursement'
      },
      {
        code: 'MiGeL',
        name: 'Mittel und Gegenstände Liste',
        description: 'List of reimbursable medical devices'
      }
    ],
    governingBody: 'FOPH (Federal Office of Public Health)',
    applicationProcess: 'Application to FOPH for MiGeL listing or tariff inclusion',
    typicalTimeline: '12-18 months',
    resources: [
      { name: 'FOPH', url: 'https://www.bag.admin.ch/bag/en/home.html' },
      { name: 'SwissDRG', url: 'https://www.swissdrg.org/en/' }
    ]
  },
  // Additional EU countries with navigator
  'IT': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Italy',
    description: 'Regional health systems with national DRG framework',
    codeTypes: [
      {
        code: 'DRG',
        name: 'DRG Nazionale',
        description: 'National diagnosis-related groups'
      }
    ],
    governingBody: 'Regional Health Authorities',
    resources: [
      { name: 'AIFA', url: 'https://www.aifa.gov.it/' }
    ]
  },
  'ES': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Spain',
    description: 'Decentralized system with autonomous regional control',
    codeTypes: [
      {
        code: 'SNS',
        name: 'Sistema Nacional de Salud',
        description: 'National health system framework'
      }
    ],
    governingBody: 'AEMPS & Regional Health Departments',
    resources: [
      { name: 'AEMPS', url: 'https://www.aemps.gob.es/' }
    ]
  },
  'NL': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Netherlands',
    description: 'DBC-based system with managed competition',
    codeTypes: [
      {
        code: 'DBC',
        name: 'Diagnose Behandel Combinatie',
        description: 'Diagnosis treatment combinations'
      }
    ],
    governingBody: 'Zorginstituut Nederland (ZIN)',
    resources: [
      { name: 'ZIN', url: 'https://www.zorginstituutnederland.nl/' }
    ]
  },
  'BE': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Belgium',
    description: 'INAMI/RIZIV nomenclature system',
    codeTypes: [
      {
        code: 'INAMI',
        name: 'National Nomenclature',
        description: 'Belgian social security nomenclature'
      }
    ],
    governingBody: 'INAMI/RIZIV',
    resources: [
      { name: 'INAMI', url: 'https://www.inami.fgov.be/' }
    ]
  },
  'AT': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Austria',
    description: 'LKF point system for hospital financing',
    codeTypes: [
      {
        code: 'LKF',
        name: 'Leistungsorientierte Krankenanstaltenfinanzierung',
        description: 'Performance-oriented hospital financing'
      }
    ],
    governingBody: 'HVB (Hauptverband)',
    resources: [
      { name: 'HVB', url: 'https://www.sozialversicherung.at/' }
    ]
  },
  'PL': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Poland',
    description: 'JGP group system with NFZ central purchasing',
    codeTypes: [
      {
        code: 'JGP',
        name: 'Jednorodne Grupy Pacjentów',
        description: 'Homogeneous patient groups'
      }
    ],
    governingBody: 'AOTMiT',
    resources: [
      { name: 'AOTMiT', url: 'https://www.aotm.gov.pl/' }
    ]
  },
  'SE': {
    code: 'COUNTRY_SPECIFIC',
    name: 'Sweden',
    description: 'NordDRG system with regional procurement',
    codeTypes: [
      {
        code: 'NordDRG',
        name: 'Nordic DRG',
        description: 'Shared DRG system across Nordic countries'
      }
    ],
    governingBody: 'TLV & Regional Councils',
    resources: [
      { name: 'TLV', url: 'https://www.tlv.se/' }
    ]
  }
};

export function getReimbursementSystem(marketCode: string): ReimbursementSystem | undefined {
  return MARKET_REIMBURSEMENT_SYSTEMS[marketCode.toUpperCase()];
}

export function getAllMarketCodes(): string[] {
  return Object.keys(MARKET_REIMBURSEMENT_SYSTEMS);
}
