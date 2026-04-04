import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FDAProductCodeResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results?: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results?: Array<{
    product_code?: string;
    device_name?: string;
    device_class?: string;
    definition?: string;
    guidance_documents?: Array<{
      guidance_title?: string;
      guidance_web_page?: string;
    }>;
    regulation_number?: string;
    medical_specialty?: string;
    submission_type_id?: string;
  }>;
}

async function fetchFromFDA(productCode: string): Promise<any> {
  const fdaUrl = `https://api.fda.gov/device/classification.json?search=product_code:"${productCode.toUpperCase()}"&limit=1`;
  
  console.log(`Fetching FDA data for product code: ${productCode}`);
  
  try {
    const response = await fetch(fdaUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Product code ${productCode} not found in FDA database`);
        return null;
      }
      throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
    }
    
    const data: FDAProductCodeResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No results found for product code: ${productCode}`);
      return null;
    }
    
    const fdaData = data.results[0];
    console.log(`Found FDA data for ${productCode}:`, fdaData);
    
    return {
      code: productCode.toUpperCase(),
      description: fdaData.device_name || 'Unknown device',
      device_class: fdaData.device_class || 'Unknown',
      regulation_number: fdaData.regulation_number || 'Unknown',
      medical_specialty: fdaData.medical_specialty || 'Unknown',
      product_code_name: fdaData.device_name,
      definition: fdaData.definition,
      guidance_documents: fdaData.guidance_documents || [],
      submission_type_id: fdaData.submission_type_id,
      fdaUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=${productCode.toUpperCase()}`
    };
    
  } catch (error) {
    console.error(`Error fetching FDA data for ${productCode}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { productCodes } = await req.json()
    
    if (!productCodes || !Array.isArray(productCodes)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product codes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${productCodes.length} product codes:`, productCodes);

    const results = []
    
    for (const code of productCodes) {
      try {
        // First check if we have it cached in our database
        const { data: cached, error: dbError } = await supabaseClient
          .from('fda_product_codes')
          .select('*')
          .eq('code', code.toUpperCase())
          .maybeSingle()

        if (dbError) {
          console.error(`Database error for ${code}:`, dbError);
        }

        let productCodeData = null;

        // If cached and recent (less than 7 days old), use cached data
        if (cached && cached.last_fetched_at) {
          const lastFetched = new Date(cached.last_fetched_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (lastFetched > weekAgo) {
            console.log(`Using cached data for ${code}`);
            productCodeData = {
              code: cached.code,
              description: cached.description,
              device_class: cached.device_class,
              regulation_number: cached.regulation_number,
              medical_specialty: cached.medical_specialty,
              product_code_name: cached.product_code_name,
              definition: cached.definition,
              guidance_documents: cached.guidance_documents,
              submission_type_id: cached.submission_type_id,
              fdaUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=${code.toUpperCase()}`
            };
          }
        }

        // If not cached or stale, fetch from FDA
        if (!productCodeData) {
          try {
            productCodeData = await fetchFromFDA(code);
            
            if (productCodeData) {
              // Cache the result
              const { error: upsertError } = await supabaseClient
                .from('fda_product_codes')
                .upsert({
                  code: productCodeData.code,
                  description: productCodeData.description,
                  device_class: productCodeData.device_class,
                  regulation_number: productCodeData.regulation_number,
                  medical_specialty: productCodeData.medical_specialty,
                  product_code_name: productCodeData.product_code_name,
                  definition: productCodeData.definition,
                  guidance_documents: productCodeData.guidance_documents,
                  submission_type_id: productCodeData.submission_type_id,
                  last_fetched_at: new Date().toISOString()
                }, {
                  onConflict: 'code'
                });

              if (upsertError) {
                console.error(`Error caching data for ${code}:`, upsertError);
              } else {
                console.log(`Cached FDA data for ${code}`);
              }
            }
          } catch (fdaError) {
            console.error(`FDA fetch failed for ${code}:`, fdaError);
            // Continue without throwing - we'll return null for this code
          }
        }

        if (productCodeData) {
          // Transform data to match FDAProductCodeInfo interface
          const transformedData = {
            code: productCodeData.code,
            description: productCodeData.description,
            deviceClass: productCodeData.device_class,
            regulationNumber: productCodeData.regulation_number,
            medicalSpecialty: productCodeData.medical_specialty,
            fdaUrl: productCodeData.fdaUrl
          };
          results.push(transformedData);
        } else {
          results.push(null);
        }
        
      } catch (error) {
        console.error(`Error processing ${code}:`, error);
        results.push(null);
      }
    }

    console.log(`Processed ${results.length} codes, found ${results.filter(r => r !== null).length} valid results`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        found: results.filter(r => r !== null).length,
        total: productCodes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fda-product-code-lookup:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Internal server error processing FDA product codes'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})