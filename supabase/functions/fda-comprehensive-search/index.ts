import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FDAComprehensiveSearchRequest {
  keywords?: string[];
  productCodes?: string[];
  deviceClass?: string;
  applicant?: string;
  brandName?: string;
  companyName?: string;
  limit?: number;
  skip?: number;
  searchTypes?: Array<'fda510k' | 'udi' | 'registration'>;
  emdnCode?: string;
}

interface FDASearchResult {
  type: 'fda510k' | 'udi' | 'registration';
  totalResults: number;
  devices: any[];
  searchTerms: string[];
  productCodes: string[];
  pagination: {
    skip: number;
    limit: number;
    hasMore: boolean;
  };
}

// Helper function to build FDA API search queries
function buildFDASearchQuery(params: FDAComprehensiveSearchRequest, endpoint: string): string {
  const searchTerms: string[] = [];
  
  // Keywords search
  if (params.keywords && params.keywords.length > 0) {
    const keywordTerms = params.keywords.map(keyword => {
      if (endpoint === 'fda510k') {
        return `device_name:*${keyword}*`;
      } else if (endpoint === 'udi') {
        return `(device_description:*${keyword}* OR brand_name:*${keyword}*)`;
      } else if (endpoint === 'registration') {
        return `proprietary_name:*${keyword}*`;
      }
      return '';
    }).filter(Boolean);
    
    if (keywordTerms.length > 0) {
      searchTerms.push(`(${keywordTerms.join(' OR ')})`);
    }
  }
  
  // Product codes
  if (params.productCodes && params.productCodes.length > 0) {
    if (endpoint === 'fda510k') {
      const codeTerms = params.productCodes.map(code => `product_code:${code}`);
      searchTerms.push(`(${codeTerms.join(' OR ')})`);
    }
    // UDI and Registration don't have direct product_code fields
  }
  
  // Device class
  if (params.deviceClass) {
    if (endpoint === 'fda510k') {
      searchTerms.push(`openfda.device_class:${params.deviceClass}`);
    }
  }
  
  // Applicant/Company name
  if (params.applicant) {
    if (endpoint === 'fda510k') {
      searchTerms.push(`applicant:*${params.applicant}*`);
    } else if (endpoint === 'udi') {
      searchTerms.push(`company_name:*${params.applicant}*`);
    } else if (endpoint === 'registration') {
      searchTerms.push(`facility_name:*${params.applicant}*`);
    }
  }
  
  // Brand name (mainly for UDI)
  if (params.brandName && endpoint === 'udi') {
    searchTerms.push(`brand_name:*${params.brandName}*`);
  }
  
  // Company name
  if (params.companyName) {
    if (endpoint === 'udi') {
      searchTerms.push(`company_name:*${params.companyName}*`);
    } else if (endpoint === 'registration') {
      searchTerms.push(`facility_name:*${params.companyName}*`);
    }
  }
  
  return searchTerms.join(' AND ');
}

// Extract search terms from EMDN code for fallback
function extractEMDNSearchTerms(emdnCode: string): string[] {
  const baseTerms: string[] = [];
  
  if (emdnCode.includes('needle') || emdnCode.startsWith('A01')) {
    baseTerms.push('needle', 'injection', 'aspiration');
  }
  if (emdnCode.includes('catheter') || emdnCode.startsWith('A06')) {
    baseTerms.push('catheter', 'tube');
  }
  if (emdnCode.includes('surgical') || emdnCode.startsWith('H')) {
    baseTerms.push('surgical', 'instrument');
  }
  if (emdnCode.includes('diagnostic') || emdnCode.startsWith('D')) {
    baseTerms.push('diagnostic', 'test', 'analyzer');
  }
  
  return baseTerms.length > 0 ? baseTerms : ['medical', 'device'];
}

// Search specific FDA endpoint
async function searchFDAEndpoint(
  endpoint: 'fda510k' | 'udi' | 'registration',
  params: FDAComprehensiveSearchRequest
): Promise<FDASearchResult> {
  const urlMap = {
    fda510k: 'https://api.fda.gov/device/510k.json',
    udi: 'https://api.fda.gov/device/udi.json',
    registration: 'https://api.fda.gov/device/registrationlisting.json'
  };
  
  const url = new URL(urlMap[endpoint]);
  url.searchParams.append('limit', Math.min(params.limit || 100, 1000).toString());
  url.searchParams.append('skip', (params.skip || 0).toString());
  
  // Build search query
  let searchQuery = buildFDASearchQuery(params, endpoint);
  
  // Fallback to EMDN-derived terms if no specific search criteria
  if (!searchQuery && params.emdnCode) {
    const emdnTerms = extractEMDNSearchTerms(params.emdnCode);
    const keywordTerms = emdnTerms.map(term => {
      if (endpoint === 'fda510k') {
        return `device_name:*${term}*`;
      } else if (endpoint === 'udi') {
        return `(device_description:*${term}* OR brand_name:*${term}*)`;
      } else if (endpoint === 'registration') {
        return `proprietary_name:*${term}*`;
      }
      return '';
    }).filter(Boolean);
    
    searchQuery = `(${keywordTerms.join(' OR ')})`;
  }
  
  if (searchQuery) {
    url.searchParams.append('search', searchQuery);
  }
  
  console.log(`Searching ${endpoint}:`, url.toString());
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MedTech-Comprehensive-Analysis/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${endpoint} API error:`, response.status, errorText);
      throw new Error(`${endpoint} API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const totalResults = data.meta?.results?.total || 0;
    const devices = data.results || [];
    const limit = params.limit || 100;
    const skip = params.skip || 0;
    
    console.log(`${endpoint} results:`, {
      totalResults,
      returnedResults: devices.length,
      searchQuery
    });
    
    return {
      type: endpoint,
      totalResults,
      devices,
      searchTerms: params.keywords || [],
      productCodes: params.productCodes || [],
      pagination: {
        skip,
        limit,
        hasMore: totalResults > (skip + devices.length)
      }
    };
    
  } catch (error) {
    console.error(`Error searching ${endpoint}:`, error);
    return {
      type: endpoint,
      totalResults: 0,
      devices: [],
      searchTerms: params.keywords || [],
      productCodes: params.productCodes || [],
      pagination: {
        skip: params.skip || 0,
        limit: params.limit || 100,
        hasMore: false
      }
    };
  }
}

// Calculate aggregated statistics
function calculateAggregatedStats(results: Record<string, FDASearchResult>) {
  const aggregatedStats = {
    totalDevices: 0,
    totalManufacturers: 0,
    topProductCodes: [] as Array<{ code: string; count: number }>,
    deviceClasses: {} as Record<string, number>,
    manufacturers: {} as Record<string, number>
  };
  
  const productCodeCounts: Record<string, number> = {};
  const manufacturerSet = new Set<string>();
  
  Object.values(results).forEach(result => {
    aggregatedStats.totalDevices += result.totalResults;
    
    result.devices.forEach((device: any) => {
      // Product codes (mainly from 510k)
      if (device.product_code) {
        productCodeCounts[device.product_code] = (productCodeCounts[device.product_code] || 0) + 1;
      }
      
      // Device classes
      if (device.device_class) {
        const className = `Class ${device.device_class}`;
        aggregatedStats.deviceClasses[className] = (aggregatedStats.deviceClasses[className] || 0) + 1;
      }
      
      // Manufacturers
      const manufacturer = device.applicant || device.company_name || device.facility_name;
      if (manufacturer) {
        manufacturerSet.add(manufacturer);
        aggregatedStats.manufacturers[manufacturer] = (aggregatedStats.manufacturers[manufacturer] || 0) + 1;
      }
    });
  });
  
  aggregatedStats.totalManufacturers = manufacturerSet.size;
  aggregatedStats.topProductCodes = Object.entries(productCodeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([code, count]) => ({ code, count }));
  
  return aggregatedStats;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const requestParams: FDAComprehensiveSearchRequest = await req.json();
    
    console.log('FDA comprehensive search request:', requestParams);
    
    const searchTypes = requestParams.searchTypes || ['fda510k', 'udi', 'registration'];
    const results: Record<string, FDASearchResult> = {};
    
    // Search all requested endpoints in parallel
    const searchPromises = searchTypes.map(async (endpoint) => {
      const result = await searchFDAEndpoint(endpoint, requestParams);
      results[endpoint] = result;
    });
    
    await Promise.all(searchPromises);
    
    // Calculate aggregated statistics
    const aggregatedStats = calculateAggregatedStats(results);
    
    // Extract EMDN-derived terms for metadata
    const emdnDerivedTerms = requestParams.emdnCode ? 
      extractEMDNSearchTerms(requestParams.emdnCode) : [];
    
    const queryTime = Date.now() - startTime;
    
    const response = {
      success: true,
      data: {
        fda510k: results.fda510k || { type: 'fda510k', totalResults: 0, devices: [], searchTerms: [], productCodes: [], pagination: { skip: 0, limit: 100, hasMore: false } },
        udi: results.udi || { type: 'udi', totalResults: 0, devices: [], searchTerms: [], productCodes: [], pagination: { skip: 0, limit: 100, hasMore: false } },
        registration: results.registration || { type: 'registration', totalResults: 0, devices: [], searchTerms: [], productCodes: [], pagination: { skip: 0, limit: 100, hasMore: false } },
        aggregatedStats,
        searchMetadata: {
          originalQuery: JSON.stringify(requestParams),
          emdnDerivedTerms,
          actualSearchTerms: requestParams.keywords || emdnDerivedTerms,
          queryTime
        }
      }
    };
    
    console.log('Comprehensive search completed:', {
      totalDevices: aggregatedStats.totalDevices,
      totalManufacturers: aggregatedStats.totalManufacturers,
      queryTime: `${queryTime}ms`
    });
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fda-comprehensive-search function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});