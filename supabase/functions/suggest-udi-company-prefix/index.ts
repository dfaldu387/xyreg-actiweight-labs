import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrefixSuggestionRequest {
  company_id: string;
  issuing_agency: string;
  company_identifier?: string; // Optional: company name or SRN for EUDAMED lookup
}

interface PrefixSuggestionResponse {
  success: boolean;
  suggested_prefix?: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  data_source: 'eudamed' | 'none';
  udi_count: number;
  algorithm_used: string;
  error?: string;
  details?: string;
}

// Algorithm to extract GS1 company prefix from GTIN-14 UDI-DIs
function extractGS1Prefix(udiDis: string[]): { prefix: string; confidence: string } {
  const validGtins = udiDis
    .map(udi => udi.replace(/^\(01\)/, '')) // Remove GS1 AI
    .filter(udi => /^\d{14}$/.test(udi)); // Must be 14 digits

  if (validGtins.length === 0) {
    return { prefix: '', confidence: 'insufficient' };
  }

  // Step 1: Remove only check digit initially, keep indicator digit
  const withoutCheckDigit = validGtins.map(gtin => 
    gtin.slice(0, -1) // Remove only last digit (check digit)
  );

  // Step 2: Find longest common prefix across all GTINs
  let commonPrefix = '';
  const firstCandidate = withoutCheckDigit[0];
  
  for (let i = 0; i < firstCandidate.length; i++) {
    const char = firstCandidate[i];
    if (withoutCheckDigit.every(candidate => candidate[i] === char)) {
      commonPrefix += char;
    } else {
      break;
    }
  }

  // Step 3: Remove the indicator digit from the final result
  // GTIN-14 typically starts with indicator digit (0-8), company prefix follows
  if (commonPrefix.length > 1 && /^[0-8]/.test(commonPrefix)) {
    commonPrefix = commonPrefix.slice(1);
  }

  // Step 4: Validate company prefix length (6-12 digits for GS1)
  if (commonPrefix.length >= 6 && commonPrefix.length <= 12) {
    const confidence = validGtins.length >= 5 ? 'high' : 
                     validGtins.length >= 3 ? 'medium' : 'low';
    return { prefix: commonPrefix, confidence };
  }

  return { prefix: '', confidence: 'insufficient' };
}

// Algorithm to extract HIBCC company prefix
function extractHIBCCPrefix(udiDis: string[]): { prefix: string; confidence: string } {
  const validHibcc = udiDis
    .filter(udi => udi.startsWith('+'))
    .map(udi => udi.slice(1)); // Remove + prefix

  if (validHibcc.length === 0) {
    return { prefix: '', confidence: 'insufficient' };
  }

  // HIBCC LIC is typically 4-6 characters
  const prefixCandidates = validHibcc.map(udi => {
    // Find where the product code likely starts (look for pattern changes)
    // Common HIBCC LIC length is 4-6 chars
    for (let len = 4; len <= Math.min(6, udi.length); len++) {
      const candidate = udi.slice(0, len);
      if (/^[A-Z0-9]+$/.test(candidate)) {
        return candidate;
      }
    }
    return udi.slice(0, 4); // Default to 4 chars
  });

  // Find most common prefix
  const prefixCounts = new Map<string, number>();
  prefixCandidates.forEach(prefix => {
    prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
  });

  const mostCommon = Array.from(prefixCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (!mostCommon) {
    return { prefix: '', confidence: 'insufficient' };
  }

  const [prefix, count] = mostCommon;
  const consistency = count / prefixCandidates.length;
  
  const confidence = consistency >= 0.8 && validHibcc.length >= 3 ? 'high' :
                    consistency >= 0.6 && validHibcc.length >= 2 ? 'medium' : 'low';

  return { prefix, confidence };
}

// Algorithm to extract ICCBBA labeler code
function extractICCBBAPrefix(udiDis: string[]): { prefix: string; confidence: string } {
  const validIccbba = udiDis
    .filter(udi => udi.startsWith('=+') || udi.startsWith('='))
    .map(udi => udi.startsWith('=+') ? udi.slice(2) : udi.slice(1));

  if (validIccbba.length === 0) {
    return { prefix: '', confidence: 'insufficient' };
  }

  // ICCBBA labeler code is exactly 6 characters
  const labelerCodes = validIccbba
    .map(udi => udi.slice(0, 6))
    .filter(code => /^[A-Z0-9]{6}$/.test(code));

  if (labelerCodes.length === 0) {
    return { prefix: '', confidence: 'insufficient' };
  }

  // All should be the same for a given organization
  const uniqueCodes = [...new Set(labelerCodes)];
  
  if (uniqueCodes.length === 1) {
    const confidence = labelerCodes.length >= 3 ? 'high' : 
                     labelerCodes.length >= 2 ? 'medium' : 'low';
    return { prefix: uniqueCodes[0], confidence };
  }

  return { prefix: '', confidence: 'insufficient' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, issuing_agency, company_identifier }: PrefixSuggestionRequest = await req.json();

    console.log('UDI Prefix Suggestion Request:', { company_id, issuing_agency, company_identifier });

    if (!company_id || !issuing_agency) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: company_id and issuing_agency'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Company not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found company:', company.name);

    // Search for EUDAMED devices using company identifier or company name
    const searchTerm = company_identifier || company.name;
    const { data: eudamedDevices, error: eudamedError } = await supabase
      .rpc('get_eudamed_devices_by_company', {
        company_identifier: searchTerm,
        limit_count: 100
      });

    if (eudamedError) {
      console.error('EUDAMED query error:', eudamedError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to query EUDAMED data'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${eudamedDevices?.length || 0} EUDAMED devices for ${searchTerm}`);

    if (!eudamedDevices || eudamedDevices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        confidence: 'insufficient',
        data_source: 'none',
        udi_count: 0,
        algorithm_used: 'none',
        details: 'No EUDAMED devices found for this company'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter devices by issuing agency and extract UDI-DIs
    const agencyMappings: { [key: string]: string[] } = {
      'GS1': ['GS1', 'gs1', 'GS1 Global'],
      'HIBCC': ['HIBCC', 'hibcc'],
      'ICCBBA': ['ICCBBA', 'iccbba']
    };

    const validAgencies = agencyMappings[issuing_agency] || [issuing_agency];
    const relevantDevices = eudamedDevices.filter((device: any) => 
      device.udi_di && device.issuing_agency && 
      validAgencies.some(agency => 
        device.issuing_agency.toLowerCase().includes(agency.toLowerCase())
      )
    );

    console.log(`Found ${relevantDevices.length} devices for agency ${issuing_agency}`);

    if (relevantDevices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        confidence: 'insufficient',
        data_source: 'eudamed',
        udi_count: 0,
        algorithm_used: issuing_agency,
        details: `No devices found with ${issuing_agency} issuing agency`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const udiDis = relevantDevices.map((device: any) => device.udi_di);
    let result: { prefix: string; confidence: string };
    let algorithmUsed: string;

    // Apply agency-specific algorithm
    switch (issuing_agency) {
      case 'GS1':
        result = extractGS1Prefix(udiDis);
        algorithmUsed = 'GS1 GTIN-14 Common Prefix Analysis';
        break;
      case 'HIBCC':
        result = extractHIBCCPrefix(udiDis);
        algorithmUsed = 'HIBCC LIC Pattern Analysis';
        break;
      case 'ICCBBA':
        result = extractICCBBAPrefix(udiDis);
        algorithmUsed = 'ICCBBA Labeler Code Extraction';
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unsupported issuing agency: ${issuing_agency}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const response: PrefixSuggestionResponse = {
      success: true,
      suggested_prefix: result.prefix || undefined,
      confidence: result.confidence as any,
      data_source: 'eudamed',
      udi_count: relevantDevices.length,
      algorithm_used: algorithmUsed,
      details: result.prefix ? 
        `Extracted from ${relevantDevices.length} ${issuing_agency} UDI-DIs` :
        `Unable to extract consistent prefix from ${relevantDevices.length} UDI-DIs`
    };

    console.log('UDI Prefix Suggestion Response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in suggest-udi-company-prefix:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});