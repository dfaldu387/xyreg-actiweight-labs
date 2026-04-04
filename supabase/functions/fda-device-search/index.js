import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FDASearchRequest {
  searchQuery?: string;
  productCode?: string;
  productCodes?: string[]; // Multiple product codes
  deviceClass?: string;
  applicant?: string;
  limit?: number;
  skip?: number;
  emdnCode?: string;
}

// Helper function to extract all product codes from FDA device data
function extractAllProductCodes(device: any): string[] {
  const codes: string[] = [];
  
  // Primary product code
  if (device.product_code) {
    codes.push(device.product_code);
  }
  
  // Look for additional product codes in various fields
  if (device.regulation_number) {
    // Extract codes from regulation numbers (format: 21CFR870.3100)
    const regMatches = device.regulation_number.match(/\d{3}\.\d{4}/g);
    if (regMatches) {
      // These aren't direct product codes but can help identify related codes
    }
  }
  
  // Check statement_or_summary for mentioned product codes
  if (device.statement_or_summary) {
    const codePattern = /\b[A-Z]{3}\b/g;
    const foundCodes = device.statement_or_summary.match(codePattern) || [];
    foundCodes.forEach(code => {
      if (code.length === 3 && !codes.includes(code)) {
        codes.push(code);
      }
    });
  }
  
  // Check device name for product code patterns
  if (device.device_name) {
    const codePattern = /\b[A-Z]{3}\b/g;
    const foundCodes = device.device_name.match(codePattern) || [];
    foundCodes.forEach(code => {
      if (code.length === 3 && !codes.includes(code)) {
        codes.push(code);
      }
    });
  }
  
  return codes;
}

// Helper function to get device name terms for common product codes
function getDeviceNameTermsForProductCode(productCode: string): string[] {
  const productCodeMappings: Record<string, string[]> = {
    'LMH': ['implant', 'dermal', 'aesthetic', 'filler', 'injectable'],
    'KGI': ['syringe', 'injection', 'needle'],
    'FTK': ['catheter', 'tube', 'drainage'],
    'BWK': ['needle', 'biopsy', 'aspiration'],
    'DQD': ['bandage', 'dressing', 'wound'],
    'BTB': ['suture', 'surgical', 'thread'],
    'OFE': ['scissors', 'surgical', 'cutting'],
    'HRO': ['forceps', 'grasping', 'surgical'],
    // Add more mappings as needed
  };
  
  return productCodeMappings[productCode] || ['device', 'medical'];
}

// Helper function to extract search terms from EMDN description
function extractSearchTermsFromEMDN(emdnCode: string): string[] {
  // Basic keyword extraction based on common medical device terminology
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      searchQuery,
      productCode,
      productCodes,
      deviceClass,
      applicant,
      limit = 100,
      skip = 0,
      emdnCode
    }: FDASearchRequest = await req.json();

    console.log('FDA device search request:', {
      searchQuery,
      productCode,
      productCodes,
      deviceClass,
      applicant,
      limit,
      skip,
      emdnCode
    });

    // Strategy: Try multiple search approaches in order of specificity
    const searchStrategies = [];
    
    // Combine single productCode with productCodes array
    const allProductCodes = [
      ...(productCode ? [productCode] : []),
      ...(productCodes || [])
    ].filter((code, index, arr) => arr.indexOf(code) === index); // Remove duplicates
    
    // Strategy 1: Multiple product codes (most specific)
    if (allProductCodes.length > 0) {
      const codeQuery = allProductCodes.map(code => `product_code:${code}`).join(' OR ');
      searchStrategies.push({
        name: 'multiple_product_codes',
        query: `(${codeQuery})`,
        description: `Product codes: ${allProductCodes.join(', ')}`
      });
    }
    
    // Strategy 2: Single product code only (backward compatibility)
    if (productCode) {
      searchStrategies.push({
        name: 'product_code_only',
        query: `product_code:${productCode}`,
        description: `Product code ${productCode} only`
      });
    }
    
    // Strategy 3: Product codes + device class
    if (allProductCodes.length > 0 && deviceClass) {
      const codeQuery = allProductCodes.map(code => `product_code:${code}`).join(' OR ');
      searchStrategies.push({
        name: 'product_codes_with_class',
        query: `(${codeQuery}) AND device_class:${deviceClass}`,
        description: `Product codes ${allProductCodes.join(', ')} with device class ${deviceClass}`
      });
    }
    
    // Strategy 4: Device name search based on product code type
    if (allProductCodes.length > 0) {
      const allDeviceNameTerms = allProductCodes.flatMap(code => getDeviceNameTermsForProductCode(code));
      const uniqueTerms = [...new Set(allDeviceNameTerms)];
      if (uniqueTerms.length > 0) {
        const nameQuery = uniqueTerms.map(term => `device_name:*${term}*`).join(' OR ');
        searchStrategies.push({
          name: 'device_name_from_product_codes',
          query: `(${nameQuery})`,
          description: `Device names for product codes ${allProductCodes.join(', ')}: ${uniqueTerms.join(', ')}`
        });
      }
    }
    
    // Strategy 5: Explicit search query
    if (searchQuery) {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      if (keywords.length > 0) {
        const keywordQuery = keywords.map(keyword => `device_name:*${keyword}*`).join(' OR ');
        searchStrategies.push({
          name: 'explicit_search',
          query: `(${keywordQuery})`,
          description: `Explicit search: ${keywords.join(', ')}`
        });
      }
    }
    
    // Strategy 6: Generic medical device search (fallback)
    searchStrategies.push({
      name: 'generic_fallback',
      query: '(device_name:*implant* OR device_name:*device* OR device_name:*medical*)',
      description: 'Generic medical device fallback'
    });

    let finalResult = null;
    let successfulStrategy = null;
    
    // Try each strategy until we get results
    for (const strategy of searchStrategies) {
      console.log(`Trying strategy: ${strategy.name} - ${strategy.description}`);
      
      const params = new URLSearchParams();
      params.append('limit', Math.min(limit, 500).toString());
      params.append('skip', skip.toString());
      params.append('search', strategy.query);
      
      // Add additional filters if provided (but not as part of main search)
      if (applicant && !strategy.query.includes('applicant:')) {
        params.set('search', `${strategy.query} AND applicant:*${applicant}*`);
      }

      const fdaApiUrl = `https://api.fda.gov/device/510k.json?${params.toString()}`;
      console.log(`Calling FDA API with strategy ${strategy.name}:`, fdaApiUrl);

      try {
        const response = await fetch(fdaApiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MedTech-Competitive-Analysis/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const resultCount = data.results?.length || 0;
          
          console.log(`Strategy ${strategy.name} returned ${resultCount} results`);
          
          if (resultCount > 0) {
            finalResult = data;
            successfulStrategy = strategy;
            break; // Success! Use this result
          }
        } else {
          const errorText = await response.text();
          console.log(`Strategy ${strategy.name} failed: ${response.status} - ${errorText}`);
          // Continue to next strategy
        }
      } catch (error) {
        console.log(`Strategy ${strategy.name} error:`, error.message);
        // Continue to next strategy
      }
    }

    // If no strategy worked, return empty results
    if (!finalResult) {
      console.log('All search strategies failed, returning empty results');
      finalResult = {
        meta: { results: { total: 0 } },
        results: []
      };
      successfulStrategy = { name: 'none', description: 'No results found' };
    }

    console.log('FDA API response received:', {
      strategy: successfulStrategy.name,
      totalResults: finalResult.meta?.results?.total || 0,
      returnedResults: finalResult.results?.length || 0
    });

    // Process and normalize FDA data with proper device class inference and multiple product codes
    const processedDevices = (finalResult.results || []).map((device: any) => {
      console.log(`[FDA] Processing device: ${device.device_name}, product_code: ${device.product_code}, original_class: ${device.device_class}`);
      
      // Extract all product codes from the device
      const allProductCodes = extractAllProductCodes(device);
      console.log(`[FDA] Extracted product codes for ${device.device_name}: ${allProductCodes.join(', ')}`);
      
      // Force all LMH devices to Class II since they are dermal fillers
      let finalDeviceClass = device.device_class;
      if (device.product_code === 'LMH' || allProductCodes.includes('LMH')) {
        finalDeviceClass = '2'; // Force Class II for all LMH (dermal fillers)
        console.log(`[FDA] LMH device detected - forcing Class II: ${device.device_name}`);
      } else if (!finalDeviceClass || finalDeviceClass.trim() === '') {
        // Try to infer from product codes
        const productCodeClassMap: Record<string, string> = {
          'KGI': '2', // Syringes are typically Class II
          'FTK': '2', // Catheters are typically Class II
          'BWK': '2', // Biopsy needles are typically Class II
          'DQD': '1', // Bandages are typically Class I
          'BTB': '2', // Sutures are typically Class II
          'OFE': '1', // Surgical scissors are typically Class I
          'HRO': '1', // Forceps are typically Class I
        };
        
        // Use the highest class from all product codes
        let inferredClass = 'Unknown';
        for (const code of allProductCodes) {
          const codeClass = productCodeClassMap[code];
          if (codeClass) {
            if (inferredClass === 'Unknown' || (codeClass === '2' && inferredClass === '1')) {
              inferredClass = codeClass;
            }
          }
        }
        
        finalDeviceClass = inferredClass;
        console.log(`[FDA] Inferred class from codes ${allProductCodes.join(', ')}: ${finalDeviceClass}`);
      }
      
      console.log(`[FDA] Final device class for ${device.device_name}: ${finalDeviceClass}`);
      
      return {
        k_number: device.k_number,
        device_name: device.device_name,
        product_code: device.product_code,
        product_codes: allProductCodes, // Include all extracted product codes
        device_class: finalDeviceClass, // Use the inferred/forced class
        date_received: device.date_received,
        decision_date: device.decision_date,
        decision: device.decision,
        statement_or_summary: device.statement_or_summary,
        applicant: device.applicant,
        contact: device.contact,
        address_1: device.address_1,
        address_2: device.address_2,
        city: device.city,
        state: device.state,
        country_code: device.country_code,
        zip: device.zip,
        postal_code: device.postal_code,
        advisory_committee: device.advisory_committee
      };
    });

    // Extract actual product codes found in the results (including all codes)
    const foundProductCodes = Array.from(new Set(
      processedDevices
        .flatMap(device => [
          ...(device.product_code ? [device.product_code] : []),
          ...(device.product_codes || [])
        ])
        .filter(Boolean)
    )).slice(0, 15); // Limit to top 15 most common

    // Calculate analytics
    const analytics = {
      total_devices: finalResult.meta?.results?.total || processedDevices.length,
      devices_by_class: {},
      devices_by_state: {},
      devices_by_applicant: {},
      regulatory_pathways: {},
      geographic_distribution: {}
    };

    // Process analytics with improved device class inference
    processedDevices.forEach((device: any) => {
      // Device class distribution with inference
      let deviceClass = device.device_class;
      
      // If device_class is missing, try to infer from product code
      if (!deviceClass || deviceClass.trim() === '') {
        console.log(`[FDA] Device missing class, product_code: "${device.product_code}", inferring...`);
        if (device.product_code) {
          // Common device class mappings for known product codes
          const productCodeClassMap: Record<string, string> = {
            'LMH': '2', // Dermal fillers are typically Class II
            'KGI': '2', // Syringes are typically Class II
            'FTK': '2', // Catheters are typically Class II
            'BWK': '2', // Biopsy needles are typically Class II
            'DQD': '1', // Bandages are typically Class I
            'BTB': '2', // Sutures are typically Class II
            'OFE': '1', // Surgical scissors are typically Class I
            'HRO': '1', // Forceps are typically Class I
          };
          
          console.log(`[FDA] Looking up product code "${device.product_code}" in mapping...`);
          const inferredClass = productCodeClassMap[device.product_code];
          deviceClass = inferredClass || 'Unknown';
          console.log(`[FDA] Product code "${device.product_code}" -> ${deviceClass} (found: ${!!inferredClass})`);
        } else {
          console.log(`[FDA] No product_code available for device, defaulting to Unknown`);
          deviceClass = 'Unknown';
        }
      } else {
        console.log(`[FDA] Device already has class: "${deviceClass}"`);
      }
      
      analytics.devices_by_class[deviceClass] = (analytics.devices_by_class[deviceClass] || 0) + 1;

      // State distribution
      const state = device.state || 'Unknown';
      analytics.devices_by_state[state] = (analytics.devices_by_state[state] || 0) + 1;

      // Applicant distribution
      const applicant = device.applicant || 'Unknown';
      analytics.devices_by_applicant[applicant] = (analytics.devices_by_applicant[applicant] || 0) + 1;

      // Regulatory pathway (510k)
      analytics.regulatory_pathways['510(k)'] = (analytics.regulatory_pathways['510(k)'] || 0) + 1;

      // Geographic distribution (same as state for now)
      analytics.geographic_distribution[state] = (analytics.geographic_distribution[state] || 0) + 1;
    });

    const result = {
      success: true,
      data: {
        devices: processedDevices,
        analytics,
        meta: finalResult.meta,
        search_params: {
          searchQuery,
          productCode,
          productCodes,
          deviceClass,
          applicant,
          limit,
          skip,
          emdnCode,
          foundProductCodes,
          successfulStrategy: successfulStrategy?.name || 'none',
          searchDescription: successfulStrategy?.description || 'No successful search',
          totalStrategiesTried: searchStrategies.length
        }
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fda-device-search function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});