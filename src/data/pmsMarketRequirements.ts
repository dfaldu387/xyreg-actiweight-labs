// Multi-market PMS requirements configuration
// Reference: FDA, Health Canada, PMDA, TGA, MHRA requirements

export interface MarketPMSConfig {
  marketCode: string;
  marketName: string;
  regulatoryBody: string;
  reportTypes: string[];
  classificationSystem: string;
  regulatoryReferences: string[];
}

export const PMS_MARKET_CONFIGS: Record<string, MarketPMSConfig> = {
  EU: {
    marketCode: 'EU',
    marketName: 'European Union',
    regulatoryBody: 'Notified Body / Competent Authority',
    reportTypes: ['PSUR', 'PMSR', 'Trend Report'],
    classificationSystem: 'MDR (I, IIa, IIb, III)',
    regulatoryReferences: [
      'MDR 2017/745 Article 83-86',
      'MEDDEV 2.12/1 rev 8'
    ]
  },
  US: {
    marketCode: 'US',
    marketName: 'United States',
    regulatoryBody: 'FDA',
    reportTypes: ['MDR', 'Annual Report', 'Periodic Report', '522 Study'],
    classificationSystem: 'FDA (I, II, III)',
    regulatoryReferences: [
      '21 CFR Part 803 (MDR)',
      '21 CFR Part 814 (PMA)',
      '21 CFR Part 822 (522 Studies)'
    ]
  },
  USA: {
    marketCode: 'USA',
    marketName: 'United States',
    regulatoryBody: 'FDA',
    reportTypes: ['MDR', 'Annual Report', 'Periodic Report', '522 Study'],
    classificationSystem: 'FDA (I, II, III)',
    regulatoryReferences: [
      '21 CFR Part 803 (MDR)',
      '21 CFR Part 814 (PMA)',
      '21 CFR Part 822 (522 Studies)'
    ]
  },
  CA: {
    marketCode: 'CA',
    marketName: 'Canada',
    regulatoryBody: 'Health Canada',
    reportTypes: ['MDR (Canada)', 'Periodic Safety Update', 'Annual Summary'],
    classificationSystem: 'CMDCAS (I, II, III, IV)',
    regulatoryReferences: [
      'MDR Regulations SOR/2019-201',
      'CMDCAS ISO 13485:2016'
    ]
  },
  JP: {
    marketCode: 'JP',
    marketName: 'Japan',
    regulatoryBody: 'PMDA',
    reportTypes: ['Periodic Report', 'Re-examination Report', 'Safety Report'],
    classificationSystem: 'PMD Act (I, II, III, IV)',
    regulatoryReferences: [
      'PMD Act Article 23-2-9',
      'MHLW Ordinance 114'
    ]
  },
  AU: {
    marketCode: 'AU',
    marketName: 'Australia',
    regulatoryBody: 'TGA',
    reportTypes: ['Adverse Event Report', 'Periodic Summary'],
    classificationSystem: 'TGA (I, IIa, IIb, III)',
    regulatoryReferences: [
      'Therapeutic Goods Act 1989',
      'TGO 78'
    ]
  },
  UK: {
    marketCode: 'UK',
    marketName: 'United Kingdom',
    regulatoryBody: 'MHRA',
    reportTypes: ['PSUR', 'Field Safety Notice', 'Trend Report'],
    classificationSystem: 'UK MDR (I, IIa, IIb, III)',
    regulatoryReferences: [
      'UK MDR 2002 (as amended)',
      'MHRA Guidance'
    ]
  },
  CN: {
    marketCode: 'CN',
    marketName: 'China',
    regulatoryBody: 'NMPA',
    reportTypes: ['Adverse Event Report', 'Periodic Summary'],
    classificationSystem: 'NMPA (I, II, III)',
    regulatoryReferences: [
      'NMPA Order No. 1',
      'MDR Management Regulation'
    ]
  }
};

// Get market configuration by code
export function getMarketPMSConfig(marketCode: string): MarketPMSConfig | undefined {
  return PMS_MARKET_CONFIGS[marketCode];
}

// Get all configured markets
export function getAllPMSMarkets(): MarketPMSConfig[] {
  return Object.values(PMS_MARKET_CONFIGS);
}
