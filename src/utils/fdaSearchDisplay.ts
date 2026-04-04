import { EnhancedCompetitiveAnalysis } from '@/types/fda';

export interface FDASearchDisplay {
  searchTerms: string[];
  productCodes: string[];
  deviceClass?: string;
  displayText: string;
}

export function extractFDASearchParameters(analysis?: EnhancedCompetitiveAnalysis | null): FDASearchDisplay {
  if (!analysis) {
    return {
      searchTerms: [],
      productCodes: [],
      displayText: 'Loading FDA search parameters...'
    };
  }

  // Extract actual search parameters from the FDA search results
  const usData = analysis.us_data;
  let searchTerms: string[] = [];
  let productCodes: string[] = [];
  
  // Try to extract search info from the FDA data itself
  if (usData && usData.devices && usData.devices.length > 0) {
    // Get unique product codes from actual results (top 5 most common)
    const productCodeCounts: Record<string, number> = {};
    usData.devices.forEach(device => {
      if (device.product_code) {
        productCodeCounts[device.product_code] = (productCodeCounts[device.product_code] || 0) + 1;
      }
    });
    
    productCodes = Object.entries(productCodeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([code]) => code);
    
    // Extract search terms from device names to infer what was searched
    const deviceNames = usData.devices
      .map(device => device.device_name?.toLowerCase() || '')
      .filter(Boolean);
    
    const commonTerms = ['needle', 'catheter', 'syringe', 'tube', 'injection', 'aspiration', 'biopsy', 'surgical', 'diagnostic'];
    searchTerms = commonTerms.filter(term => 
      deviceNames.some(name => name.includes(term))
    ).slice(0, 4);
  }
  
  // Fallback: basic keywords from EMDN code if no FDA data
  if (searchTerms.length === 0) {
    const emdnCode = analysis.emdn_code;
    if (emdnCode.startsWith('A01')) {
      searchTerms.push('needle', 'injection');
    } else if (emdnCode.startsWith('D')) {
      searchTerms.push('diagnostic', 'test');
    } else if (emdnCode.startsWith('H')) {
      searchTerms.push('surgical', 'instrument');
    } else {
      searchTerms.push('medical device');
    }
  }

  // Format display text showing actual search results
  let displayParts: string[] = [];
  
  if (productCodes.length > 0) {
    displayParts.push(`Found Product Codes: ${productCodes.join(', ')}`);
  }
  
  if (searchTerms.length > 0) {
    displayParts.push(`Search Terms: ${searchTerms.join(', ')}`);
  }
  
  // Add device count for context
  if (usData?.total_devices) {
    displayParts.push(`${usData.total_devices} devices found`);
  }
  
  const displayText = displayParts.length > 0 
    ? displayParts.join(' | ') 
    : 'General device search';

  return {
    searchTerms,
    productCodes,
    displayText
  };
}