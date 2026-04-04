
import { ProductMarket } from './marketRiskClassMapping';
import { NotifiedBody } from '@/types/notifiedBody';

// Strategic Partner entry for market-specific partners
export interface MarketPartnerEntry {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: 'Identified' | 'In Discussion' | 'Contracted';
  notes?: string;
  supplierId?: string; // Optional link to existing Supplier database
}

export type PartnerCategory = 'distribution' | 'clinical' | 'regulatory';

// Market-specific detail interfaces
export interface MarketSponsorDetails {
  sponsorName?: string;
  sponsorAddress?: string;
  sponsorCity?: string;
  sponsorPostalCode?: string;
  sponsorCountry?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  sponsorContactPerson?: string;
}

export interface MarketAgentDetails {
  agentName?: string;
  agentAddress?: string;
  agentCity?: string;
  agentPostalCode?: string;
  agentCountry?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentContactPerson?: string;
}

export interface MarketAuthorizedRepDetails {
  repName?: string;
  repAddress?: string;
  repCity?: string;
  repPostalCode?: string;
  repCountry?: string;
  repEmail?: string;
  repPhone?: string;
  repContactPerson?: string;
}

export interface MarketImporterDetails {
  importerName?: string;
  importerAddress?: string;
  importerCity?: string;
  importerPostalCode?: string;
  importerCountry?: string;
  importerEmail?: string;
  importerPhone?: string;
  importerContactPerson?: string;
}

export interface MarketRegistrationHolderDetails {
  holderName?: string;
  holderAddress?: string;
  holderCity?: string;
  holderPostalCode?: string;
  holderCountry?: string;
  holderEmail?: string;
  holderPhone?: string;
  holderContactPerson?: string;
}

export interface MarketLegalAgentDetails {
  legalAgentName?: string;
  legalAgentAddress?: string;
  legalAgentCity?: string;
  legalAgentPostalCode?: string;
  legalAgentCountry?: string;
  legalAgentEmail?: string;
  legalAgentPhone?: string;
  legalAgentContactPerson?: string;
}

export interface MarketMAHDetails {
  mahName?: string;
  mahAddress?: string;
  mahCity?: string;
  mahPostalCode?: string;
  mahCountry?: string;
  mahEmail?: string;
  mahPhone?: string;
  mahContactPerson?: string;
}

export interface MarketLicenseDetails {
  licenseNumber?: string;
  licenseType?: string;
  licenseStatus?: string;
  licenseExpiryDate?: string;
  licensingAuthority?: string;
}

export interface EnhancedProductMarket extends ProductMarket {
  name: string; // Required property to match client types
  launchDate?: Date | string;
  certificateNumber?: string;
  certificateType?: string;

  // Classification rule info from assistant (persisted)
  classificationRule?: {
    rule: string;
    description: string;
    determinedBy: 'assistant' | 'manual';
    ruleText?: string;
    ruleSource?: string;
    decisionPath?: {
      path: string[];
      answers: Record<string, string>;
    };
  };

  // Component-based classification for procedure packs and SiMD
  componentClassification?: {
    components: Array<{
      id: string;
      name: string;
      description?: string;
      riskClass: string;
      componentType: 'device' | 'software';
      isFromProductDefinition?: boolean;
      isSelected?: boolean;
    }>;
    overallRiskClass?: string;
  };

  conformityAssessmentRoute?: string;
  clinicalTrialsRequired?: boolean;
  labelingRequirements?: string[];
  pmsRequirement?: string;
  pmcfRequired?: boolean;
  udiRequirements?: string;
  customRequirements?: string;
  localAuthorizedRep?: string;
  marketLaunchStatus?: 'planned' | 'launched' | 'withdrawn';
  actualLaunchDate?: Date | string;
  approvalExpiryDate?: Date | string;
  responsiblePerson?: string;
  currency?: string;
  riskClassification?: string;
  
  // Market-specific details
  australianSponsor?: MarketSponsorDetails;
  usAgent?: MarketAgentDetails;
  euAuthorizedRep?: MarketAuthorizedRepDetails;
  canadianImporter?: MarketImporterDetails;
  brazilianRegistrationHolder?: MarketRegistrationHolderDetails;
  chinaLegalAgent?: MarketLegalAgentDetails;
  japanMAH?: MarketMAHDetails;
  indiaLicense?: MarketLicenseDetails;
  ukResponsiblePerson?: MarketAuthorizedRepDetails;
  swissAuthorizedRep?: MarketAuthorizedRepDetails;
  koreaImporter?: MarketImporterDetails;
  
  // Universal optional importer details (separate from market-specific requirements)
  importerDetails?: MarketImporterDetails;

  // EU-specific Notified Body configuration
  requireNotifiedBody?: boolean;
  notifiedBody?: NotifiedBody;

  // Economic Buyer Profile (per-market)
  budgetType?: string;
  buyerType?: string;
  codingStrategy?: string;       // US-specific
  procurementPath?: string;      // UK/EU-specific
  mhlwCategory?: string;         // Japan-specific
  vbpStatus?: string;            // China-specific
  prosthesesListTargeting?: boolean; // Australia-specific
  prosthesesListGrouping?: string;   // Australia-specific
  primaryPayer?: string;         // India/Brazil-specific
  reimbursementCode?: string;
  
  // Market-specific strategic partners
  distributionPartners?: MarketPartnerEntry[];
  clinicalPartners?: MarketPartnerEntry[];
  regulatoryPartners?: MarketPartnerEntry[];
}

// Market field configuration mapping
export const MARKET_FIELD_CONFIGS: Record<string, {
  label: string;
  fields: Array<{
    key: keyof EnhancedProductMarket;
    fieldType: 'sponsor' | 'agent' | 'rep' | 'importer' | 'holder' | 'legalAgent' | 'mah' | 'license';
    requiredFields: string[];
    optionalFields: string[];
  }>;
  hasNotifiedBody?: boolean;
}> = {
  'AU': {
    label: 'Australian Sponsor',
    fields: [{
      key: 'australianSponsor',
      fieldType: 'sponsor',
      requiredFields: ['sponsorName', 'sponsorAddress', 'sponsorCity'],
      optionalFields: ['sponsorPostalCode', 'sponsorEmail', 'sponsorPhone', 'sponsorContactPerson']
    }]
  },
  'US': {
    label: 'US Agent',
    fields: [{
      key: 'usAgent',
      fieldType: 'agent',
      requiredFields: ['agentName', 'agentAddress', 'agentCity'],
      optionalFields: ['agentPostalCode', 'agentEmail', 'agentPhone', 'agentContactPerson']
    }]
  },
  'USA': {
    label: 'US Agent',
    fields: [{
      key: 'usAgent',
      fieldType: 'agent',
      requiredFields: ['agentName', 'agentAddress', 'agentCity'],
      optionalFields: ['agentPostalCode', 'agentEmail', 'agentPhone', 'agentContactPerson']
    }]
  },
  'EU': {
    label: 'EU Authorized Representative',
    fields: [{
      key: 'euAuthorizedRep',
      fieldType: 'rep',
      requiredFields: ['repName', 'repAddress', 'repCity', 'repCountry'],
      optionalFields: ['repPostalCode', 'repEmail', 'repPhone', 'repContactPerson']
    }],
    hasNotifiedBody: true
  },
  'CA': {
    label: 'Canadian Importer',
    fields: [{
      key: 'canadianImporter',
      fieldType: 'importer',
      requiredFields: ['importerName', 'importerAddress', 'importerCity'],
      optionalFields: ['importerPostalCode', 'importerEmail', 'importerPhone', 'importerContactPerson']
    }]
  },
  'BR': {
    label: 'Brazilian Registration Holder',
    fields: [{
      key: 'brazilianRegistrationHolder',
      fieldType: 'holder',
      requiredFields: ['holderName', 'holderAddress', 'holderCity'],
      optionalFields: ['holderPostalCode', 'holderEmail', 'holderPhone', 'holderContactPerson']
    }]
  },
  'CN': {
    label: 'China Legal Agent',
    fields: [{
      key: 'chinaLegalAgent',
      fieldType: 'legalAgent',
      requiredFields: ['legalAgentName', 'legalAgentAddress', 'legalAgentCity'],
      optionalFields: ['legalAgentPostalCode', 'legalAgentEmail', 'legalAgentPhone', 'legalAgentContactPerson']
    }]
  },
  'JP': {
    label: 'Marketing Authorization Holder (MAH)',
    fields: [{
      key: 'japanMAH',
      fieldType: 'mah',
      requiredFields: ['mahName', 'mahAddress', 'mahCity'],
      optionalFields: ['mahPostalCode', 'mahEmail', 'mahPhone', 'mahContactPerson']
    }]
  },
  'IN': {
    label: 'Import License Information',
    fields: [{
      key: 'indiaLicense',
      fieldType: 'license',
      requiredFields: ['licenseNumber', 'licensingAuthority'],
      optionalFields: ['licenseType', 'licenseStatus', 'licenseExpiryDate']
    }]
  },
  'UK': {
    label: 'UK Responsible Person',
    fields: [{
      key: 'ukResponsiblePerson',
      fieldType: 'rep',
      requiredFields: ['repName', 'repAddress', 'repCity'],
      optionalFields: ['repPostalCode', 'repEmail', 'repPhone', 'repContactPerson']
    }]
  },
  'CH': {
    label: 'Swiss Authorized Representative',
    fields: [{
      key: 'swissAuthorizedRep',
      fieldType: 'rep',
      requiredFields: ['repName', 'repAddress', 'repCity'],
      optionalFields: ['repPostalCode', 'repEmail', 'repPhone', 'repContactPerson']
    }]
  },
  'KR': {
    label: 'Korea Importer',
    fields: [{
      key: 'koreaImporter',
      fieldType: 'importer',
      requiredFields: ['importerName', 'importerAddress', 'importerCity'],
      optionalFields: ['importerPostalCode', 'importerEmail', 'importerPhone', 'importerContactPerson']
    }]
  }
};

// Helper function to convert basic markets to enhanced markets with name
export function convertToEnhancedMarkets(markets: ProductMarket[]): EnhancedProductMarket[] {
  const marketNames: Record<string, string> = {
    'EU': 'European Union',
    'US': 'United States',
    'USA': 'United States',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'BR': 'Brazil',
    'CN': 'China',
    'IN': 'India',
    'UK': 'United Kingdom',
    'CH': 'Switzerland',
    'KR': 'South Korea'
  };

  return markets.map(market => ({
    ...market,
    name: marketNames[market.code] || market.code
  }));
}

// Validation functions for market-specific fields
export function validateMarketDetails(market: EnhancedProductMarket): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = MARKET_FIELD_CONFIGS[market.code];
  
  if (!config || !market.selected) {
    return { isValid: true, errors: [] };
  }

  config.fields.forEach(fieldConfig => {
    const details = market[fieldConfig.key] as any;
    if (details) {
      fieldConfig.requiredFields.forEach(requiredField => {
        if (!details[requiredField] || details[requiredField].trim() === '') {
          errors.push(`${config.label}: ${requiredField} is required`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to get market-specific field requirements
export function getMarketFieldRequirements(marketCode: string): {
  label: string;
  requiredFields: string[];
  optionalFields: string[];
} | null {
  const config = MARKET_FIELD_CONFIGS[marketCode];
  if (!config) return null;
  
  const allRequired: string[] = [];
  const allOptional: string[] = [];
  
  config.fields.forEach(field => {
    allRequired.push(...field.requiredFields);
    allOptional.push(...field.optionalFields);
  });
  
  return {
    label: config.label,
    requiredFields: allRequired,
    optionalFields: allOptional
  };
}
