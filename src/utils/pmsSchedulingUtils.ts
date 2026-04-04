// Utility functions for Post-Market Surveillance (PMS) scheduling and management

import { formatDeviceClassCode } from './deviceClassUtils';
import { getMarketPMSConfig } from '@/data/pmsMarketRequirements';

// Market-specific PMS requirement
export interface MarketPMSRequirement {
  marketCode: string;
  marketName: string;
  reportType: string;
  interval: number; // months
  description: string;
  isRequired: boolean;
  regulatoryBody: string;
  regulatoryReferences?: string[];
  specificRequirements?: string[];
}

// Complete PMS schedule across all markets
export interface PMSSchedule {
  primaryMarket: MarketPMSRequirement | null; // Most stringent requirement
  additionalMarkets: MarketPMSRequirement[];
  allRequiredReports: MarketPMSRequirement[];
}

// Legacy interface for backward compatibility
export interface LegacyPMSSchedule {
  interval: number;
  reportType: string;
  description: string;
  isRequired: boolean;
}

export interface ProductMarket {
  code: string;
  name: string;
  status?: string;
  selected?: boolean;
  riskClass?: string;
}

/**
 * Get EU MDR PMS requirements
 */
function getEUPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('EU');
  
  // Class I devices only submit reports when asked
  if (normalizedClass === 'I') {
    return {
      marketCode: 'EU',
      marketName: 'European Union',
      reportType: 'On-Demand',
      interval: 60, // Placeholder for on-demand
      description: 'Class I devices only submit PMSR when requested by governing bodies',
      isRequired: false,
      regulatoryBody: config?.regulatoryBody || 'Notified Body',
      regulatoryReferences: config?.regulatoryReferences
    };
  }

  // Class IIa devices (bi-yearly PSUR)
  if (normalizedClass === 'IIa') {
    return {
      marketCode: 'EU',
      marketName: 'European Union',
      reportType: 'PSUR',
      interval: 24, // 2 years
      description: 'Class IIa requires bi-yearly Periodic Safety Update Reports',
      isRequired: isLaunched,
      regulatoryBody: config?.regulatoryBody || 'Notified Body',
      regulatoryReferences: config?.regulatoryReferences
    };
  }

  // Class IIb and III devices (yearly PSUR)
  if (normalizedClass === 'IIb' || normalizedClass === 'III') {
    return {
      marketCode: 'EU',
      marketName: 'European Union',
      reportType: 'PSUR',
      interval: 12, // 1 year
      description: `Class ${normalizedClass} requires yearly Periodic Safety Update Reports`,
      isRequired: isLaunched,
      regulatoryBody: config?.regulatoryBody || 'Notified Body',
      regulatoryReferences: config?.regulatoryReferences
    };
  }

  // Default fallback
  return {
    marketCode: 'EU',
    marketName: 'European Union',
    reportType: 'PSUR',
    interval: 12,
    description: 'Default yearly reporting schedule',
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'Notified Body',
    regulatoryReferences: config?.regulatoryReferences
  };
}

/**
 * Get FDA/US PMS requirements
 */
function getUSPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('US');
  
  // Class I - minimal MDR reporting
  if (normalizedClass === 'I') {
    return {
      marketCode: 'US',
      marketName: 'United States',
      reportType: 'MDR',
      interval: 12, // Annual summary
      description: 'Class I devices: Medical Device Reporting (adverse events as they occur)',
      isRequired: isLaunched,
      regulatoryBody: config?.regulatoryBody || 'FDA',
      regulatoryReferences: config?.regulatoryReferences,
      specificRequirements: ['Report deaths within 30 days', 'Report serious injuries within 30 days']
    };
  }

  // Class II - MDR + potential 522 studies
  if (normalizedClass === 'II' || normalizedClass === 'IIa' || normalizedClass === 'IIb') {
    return {
      marketCode: 'US',
      marketName: 'United States',
      reportType: 'MDR + Annual Report',
      interval: 12, // Annual
      description: 'Class II devices: MDR reporting + Annual Reports (if 510(k) required)',
      isRequired: isLaunched,
      regulatoryBody: config?.regulatoryBody || 'FDA',
      regulatoryReferences: config?.regulatoryReferences,
      specificRequirements: ['MDR reports as events occur', 'Annual report if requested by FDA']
    };
  }

  // Class III - PMA annual reports + MDR
  if (normalizedClass === 'III') {
    return {
      marketCode: 'US',
      marketName: 'United States',
      reportType: 'PMA Annual Report + MDR',
      interval: 12, // Annual
      description: 'Class III devices: PMA Annual Reports required + MDR reporting',
      isRequired: isLaunched,
      regulatoryBody: config?.regulatoryBody || 'FDA',
      regulatoryReferences: config?.regulatoryReferences,
      specificRequirements: [
        'PMA Annual Report (within 60 days of anniversary)',
        'MDR reports as events occur',
        'Potential 522 post-market surveillance study'
      ]
    };
  }

  // Default
  return {
    marketCode: 'US',
    marketName: 'United States',
    reportType: 'MDR',
    interval: 12,
    description: 'Medical Device Reporting requirements',
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'FDA',
    regulatoryReferences: config?.regulatoryReferences
  };
}

/**
 * Get Canada Health Canada PMS requirements
 */
function getCanadaPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('CA');
  
  // Canada uses Class I-IV system
  const canadaReportInterval = normalizedClass === 'I' ? 24 : 
                                normalizedClass === 'II' || normalizedClass === 'IIa' ? 18 : 12;
  
  return {
    marketCode: 'CA',
    marketName: 'Canada',
    reportType: 'MDR (Canada) + Periodic Summary',
    interval: canadaReportInterval,
    description: `Class ${normalizedClass}: Mandatory incident reporting + periodic safety updates`,
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'Health Canada',
    regulatoryReferences: config?.regulatoryReferences,
    specificRequirements: [
      'Report incidents within 10-30 days',
      'Submit periodic safety update reports'
    ]
  };
}

/**
 * Get Japan PMDA PMS requirements
 */
function getJapanPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('JP');
  
  // Japan requires re-examination for new devices
  const japanInterval = normalizedClass === 'III' || normalizedClass === 'IV' ? 12 : 24;
  
  return {
    marketCode: 'JP',
    marketName: 'Japan',
    reportType: 'Periodic Report + Re-examination',
    interval: japanInterval,
    description: `Class ${normalizedClass}: PMDA periodic reporting and re-examination requirements`,
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'PMDA',
    regulatoryReferences: config?.regulatoryReferences,
    specificRequirements: [
      'Periodic safety reports',
      'Re-examination period (typically 3-7 years for new devices)'
    ]
  };
}

/**
 * Get Australia TGA PMS requirements
 */
function getAustraliaPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('AU');
  
  return {
    marketCode: 'AU',
    marketName: 'Australia',
    reportType: 'Adverse Event Report',
    interval: 12,
    description: `Class ${normalizedClass}: TGA adverse event reporting and periodic summaries`,
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'TGA',
    regulatoryReferences: config?.regulatoryReferences,
    specificRequirements: [
      'Report adverse events as they occur',
      'Annual summary reports for higher risk devices'
    ]
  };
}

/**
 * Get UK MHRA PMS requirements (post-Brexit)
 */
function getUKPMSRequirements(
  deviceClass: string | null | undefined,
  isLaunched: boolean
): MarketPMSRequirement {
  const normalizedClass = formatDeviceClassCode(deviceClass);
  const config = getMarketPMSConfig('UK');
  
  // Similar to EU but independent
  const ukInterval = normalizedClass === 'I' ? 60 :
                     normalizedClass === 'IIa' ? 24 : 12;
  
  return {
    marketCode: 'UK',
    marketName: 'United Kingdom',
    reportType: normalizedClass === 'I' ? 'On-Demand' : 'PSUR',
    interval: ukInterval,
    description: `Class ${normalizedClass}: UK MDR requirements (aligned with EU MDR)`,
    isRequired: isLaunched,
    regulatoryBody: config?.regulatoryBody || 'MHRA',
    regulatoryReferences: config?.regulatoryReferences
  };
}

/**
 * Determines PMS requirements for all selected markets
 */
export function getPMSSchedule(
  deviceClass: string | null | undefined,
  markets: ProductMarket[] = [],
  isLaunched: boolean = false
): PMSSchedule {
  const requirements: MarketPMSRequirement[] = [];
  
  // Get selected markets only
  const selectedMarkets = markets.filter((m: any) => m.selected === true);
  
  if (selectedMarkets.length === 0) {
    // No markets selected, return empty schedule
    return {
      primaryMarket: null,
      additionalMarkets: [],
      allRequiredReports: []
    };
  }
  
  selectedMarkets.forEach((market: any) => {
    // Use market-specific device class if available, otherwise use product-level class
    const marketDeviceClass = market.riskClass || deviceClass;
    
    switch(market.code) {
      case 'EU':
        requirements.push(getEUPMSRequirements(marketDeviceClass, isLaunched));
        break;
      case 'US':
      case 'USA':
        requirements.push(getUSPMSRequirements(marketDeviceClass, isLaunched));
        break;
      case 'CA':
        requirements.push(getCanadaPMSRequirements(marketDeviceClass, isLaunched));
        break;
      case 'JP':
        requirements.push(getJapanPMSRequirements(marketDeviceClass, isLaunched));
        break;
      case 'AU':
        requirements.push(getAustraliaPMSRequirements(marketDeviceClass, isLaunched));
        break;
      case 'UK':
        requirements.push(getUKPMSRequirements(marketDeviceClass, isLaunched));
        break;
      default:
        // For other markets, use EU-style rules as default
        requirements.push({
          ...getEUPMSRequirements(marketDeviceClass, isLaunched),
          marketCode: market.code,
          marketName: market.name || market.code
        });
        break;
    }
  });
  
  // Sort by most stringent requirement (shortest interval, excluding on-demand)
  const sortedRequirements = [...requirements].sort((a, b) => {
    // On-demand should be last
    if (a.reportType === 'On-Demand') return 1;
    if (b.reportType === 'On-Demand') return -1;
    return a.interval - b.interval;
  });
  
  return {
    primaryMarket: sortedRequirements[0] || null,
    additionalMarkets: sortedRequirements.slice(1),
    allRequiredReports: requirements.filter(r => r.isRequired)
  };
}

/**
 * Legacy function for backward compatibility
 * Returns EU-style schedule format
 */
export function getLegacyPMSSchedule(
  deviceClass: string | null | undefined,
  markets: ProductMarket[] = [],
  isLaunched: boolean = false
): LegacyPMSSchedule {
  const schedule = getPMSSchedule(deviceClass, markets, isLaunched);
  
  if (!schedule.primaryMarket) {
    return {
      interval: 12,
      reportType: 'PSUR',
      description: 'No markets selected',
      isRequired: false
    };
  }
  
  return {
    interval: schedule.primaryMarket.interval,
    reportType: schedule.primaryMarket.reportType,
    description: schedule.primaryMarket.description,
    isRequired: schedule.primaryMarket.isRequired
  };
}

/**
 * Calculates the next PMS due date based on schedule
 */
export function calculateNextPMSDate(
  lastPMSDate: Date,
  schedule: PMSSchedule | LegacyPMSSchedule | MarketPMSRequirement
): Date | null {
  // Handle different schedule types
  let interval: number;
  let reportType: string;
  
  if ('primaryMarket' in schedule) {
    // New PMSSchedule format
    if (!schedule.primaryMarket) return null;
    interval = schedule.primaryMarket.interval;
    reportType = schedule.primaryMarket.reportType;
  } else if ('interval' in schedule && 'reportType' in schedule) {
    // Legacy or MarketPMSRequirement format
    interval = schedule.interval;
    reportType = schedule.reportType;
  } else {
    return null;
  }
  
  // For on-demand reporting, return null (no scheduled date)
  if (reportType === 'On-Demand') {
    return null;
  }

  const nextDate = new Date(lastPMSDate);
  nextDate.setMonth(nextDate.getMonth() + interval);
  return nextDate;
}

/**
 * Checks if a phase is a post-market surveillance phase
 */
export function isPostMarketSurveillancePhase(phaseName: string): boolean {
  if (!phaseName) return false;
  
  const name = phaseName.toLowerCase();
  return name.includes('post-market surveillance') ||
         name.includes('post market surveillance') ||
         name.includes('pms') ||
         name.includes('post-market') ||
         name.includes('surveillance');
}

/**
 * Generates recurring PMS milestones for a given timeframe
 */
export function generatePMSMilestones(
  startDate: Date,
  endDate: Date,
  schedule: PMSSchedule | LegacyPMSSchedule | MarketPMSRequirement
): Date[] {
  // Handle different schedule types
  let interval: number;
  let reportType: string;
  
  if ('primaryMarket' in schedule) {
    if (!schedule.primaryMarket) return [];
    interval = schedule.primaryMarket.interval;
    reportType = schedule.primaryMarket.reportType;
  } else if ('interval' in schedule && 'reportType' in schedule) {
    interval = schedule.interval;
    reportType = schedule.reportType;
  } else {
    return [];
  }
  
  if (reportType === 'On-Demand') {
    return [];
  }

  const milestones: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    milestones.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + interval);
  }

  return milestones;
}

/**
 * Validates PMS configuration for a product
 */
export function validatePMSConfiguration(
  deviceClass: string | null | undefined,
  markets: ProductMarket[] = [],
  pmsDate: Date | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!deviceClass) {
    errors.push('Device class must be specified for PMS scheduling');
  }

  const normalizedClass = formatDeviceClassCode(deviceClass);
  const schedule = getPMSSchedule(normalizedClass, markets, true);

  // Check if any required reports are missing dates
  if (schedule.allRequiredReports.length > 0 && !pmsDate) {
    schedule.allRequiredReports.forEach(req => {
      errors.push(
        `${req.reportType} date is required for ${req.marketName} (Class ${normalizedClass})`
      );
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}