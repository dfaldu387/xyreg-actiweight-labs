
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

// Parse markets data from storage (string or object) with enhanced field support
export function parseMarketsFromStorage(marketsData: any): any[] {
  if (!marketsData) return [];
  
  // If already an array, return it
  if (Array.isArray(marketsData)) {
    return marketsData;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof marketsData === 'string') {
    try {
      const parsed = JSON.parse(marketsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse markets data:", e);
      return [];
    }
  }
  
  return [];
}

// Check if markets have enhanced fields (including new market-specific details)
export function hasEnhancedMarketFields(markets: any[]): boolean {
  if (!markets.length) return false;
  
  // Check if the first item has at least one of the enhanced fields
  const firstMarket = markets[0];
  
  // Only check for enhanced fields if the market is an object, not a string
  if (typeof firstMarket !== 'object' || firstMarket === null) {
    return false;
  }
  
  return 'launchDate' in firstMarket || 
         'certificateNumber' in firstMarket || 
         'clinicalTrialsRequired' in firstMarket ||
         'australianSponsor' in firstMarket ||
         'usAgent' in firstMarket ||
         'euAuthorizedRep' in firstMarket ||
         'canadianImporter' in firstMarket ||
         'brazilianRegistrationHolder' in firstMarket ||
         'chinaLegalAgent' in firstMarket ||
         'japanMAH' in firstMarket ||
         'indiaLicense' in firstMarket;
}

// Convert any market structure to EnhancedProductMarket (ensuring name is populated and preserving market-specific details)
export function convertToEnhancedMarkets(markets: any[]): EnhancedProductMarket[] {
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
    // Ensure name property exists
    name: market.name || marketNames[market.code] || market.code,
    // Preserve all market-specific detail fields if they exist
    australianSponsor: market.australianSponsor || undefined,
    usAgent: market.usAgent || undefined,
    euAuthorizedRep: market.euAuthorizedRep || undefined,
    canadianImporter: market.canadianImporter || undefined,
    brazilianRegistrationHolder: market.brazilianRegistrationHolder || undefined,
    chinaLegalAgent: market.chinaLegalAgent || undefined,
    japanMAH: market.japanMAH || undefined,
    indiaLicense: market.indiaLicense || undefined,
    ukResponsiblePerson: market.ukResponsiblePerson || undefined,
    swissAuthorizedRep: market.swissAuthorizedRep || undefined,
    koreaImporter: market.koreaImporter || undefined
  }));
}

// Helper function to safely serialize enhanced markets for storage
export function serializeEnhancedMarkets(markets: EnhancedProductMarket[]): string {
  try {
    return JSON.stringify(markets);
  } catch (error) {
    console.error('Failed to serialize enhanced markets:', error);
    return JSON.stringify([]);
  }
}

// Helper function to ensure backward compatibility when loading markets
export function ensureMarketCompatibility(markets: any[]): EnhancedProductMarket[] {
  return markets.map(market => {
    // If it's a simple string market code, convert to basic market object
    if (typeof market === 'string') {
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
      
      return {
        code: market,
        name: marketNames[market] || market,
        selected: true, // Assume selected if it was stored as a string
        riskClass: 'I'
      };
    }
    
    // Ensure enhanced market has all required properties
    return {
      code: market.code || '',
      name: market.name || market.code || '',
      selected: market.selected !== undefined ? market.selected : true,
      riskClass: market.riskClass || 'I',
      ...market // Preserve all other properties including market-specific details
    };
  });
}
