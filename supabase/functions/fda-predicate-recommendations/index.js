// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  deviceName: string;
  deviceClass?: string;
  productCode?: string;
}

interface RecommendationResponse {
  success: boolean;
  data?: {
    recommendations: Array<{
      kNumber: string;
      confidence: number;
      reasoning: string;
    }>;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deviceName, deviceClass, productCode }: RecommendationRequest = await req.json();

    if (!deviceName) {
      throw new Error('Device name is required');
    }

    console.log(`Generating predicate recommendations for: ${deviceName}`);

    // Search FDA database for similar devices
    const searchUrl = new URL('https://api.fda.gov/device/510k.json');
    const searchParams = new URLSearchParams();
    
    // Build search query
    let searchQuery = '';
    if (deviceName) {
      // Clean device name for search
      const cleanDeviceName = deviceName.replace(/[^\w\s]/g, ' ').trim();
      searchQuery += `device_name:"${cleanDeviceName}"`;
    }
    
    if (productCode) {
      if (searchQuery) searchQuery += ' AND ';
      searchQuery += `product_code:"${productCode}"`;
    }
    
    if (deviceClass) {
      if (searchQuery) searchQuery += ' AND ';
      searchQuery += `openfda.device_class:"${deviceClass}"`;
    }

    searchParams.append('search', searchQuery);
    searchParams.append('limit', '50');
    searchUrl.search = searchParams.toString();

    console.log(`Searching FDA with query: ${searchQuery}`);

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      console.error(`FDA API returned error: ${response.status} - ${response.statusText}`);
      console.log('Returning empty recommendations due to FDA API failure');
      
      // Return empty results when FDA API fails - be honest rather than providing fake data
      return new Response(JSON.stringify({
        success: true,
        data: { recommendations: [] },
        message: 'FDA API temporarily unavailable. Please try again later.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('No FDA results found');
      return new Response(JSON.stringify({
        success: true,
        data: { recommendations: [] }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and process results to generate recommendations
    const validRecommendations = [];
    
    for (const result of data.results.slice(0, 10)) { // Check more results to get better matches
      if (!result.k_number) continue;
      
      // Validate K-number exists by checking if we can fetch its details
      const isValid = await validateKNumber(result.k_number);
      if (!isValid) {
        console.warn(`Skipping invalid K-number: ${result.k_number}`);
        continue;
      }
      
      let confidence = 0.6; // Base confidence
      
      // Increase confidence for exact matches
      if (result.device_name && deviceName) {
        const similarity = calculateSimilarity(result.device_name.toLowerCase(), deviceName.toLowerCase());
        confidence += similarity * 0.3;
      }
      
      // Increase confidence for matching product code
      if (result.product_code === productCode) {
        confidence += 0.2;
      }
      
      // Increase confidence for matching device class
      if (result.device_class === deviceClass) {
        confidence += 0.15;
      }

      const reasoning = generateReasoning(result, deviceName, productCode, deviceClass);

      validRecommendations.push({
        kNumber: result.k_number,
        confidence: Math.min(confidence, 1.0),
        reasoning
      });
      
      // Stop when we have 5 valid recommendations
      if (validRecommendations.length >= 5) break;
    }
    
    const recommendations = validRecommendations.sort((a, b) => b.confidence - a.confidence);
    console.log(`Found ${recommendations.length} validated recommendations (from ${data.results.length} total results)`);

    return new Response(JSON.stringify({
      success: true,
      data: { recommendations }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / totalWords;
}

async function validateKNumber(kNumber: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.fda.gov/device/510k.json?search=k_number:${kNumber}&limit=1`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.results && data.results.length > 0;
  } catch (error) {
    console.warn(`Failed to validate K-number ${kNumber}:`, error);
    return false;
  }
}

function generateReasoning(result: any, deviceName: string, productCode?: string, deviceClass?: string): string {
  const reasons = [];
  
  if (result.device_name && deviceName) {
    const similarity = calculateSimilarity(result.device_name.toLowerCase(), deviceName.toLowerCase());
    if (similarity > 0.3) {
      reasons.push('similar device name');
    }
  }
  
  if (result.product_code === productCode) {
    reasons.push('matching product code');
  }
  
  if (result.device_class === deviceClass) {
    reasons.push('same device class');
  }
  
  if (result.applicant) {
    reasons.push(`from ${result.applicant}`);
  }
  
  if (reasons.length === 0) {
    return 'Related device in FDA database';
  }
  
  return `Recommended based on ${reasons.join(', ')}`;
}