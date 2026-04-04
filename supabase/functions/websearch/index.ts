import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple XOR decryption function (matches frontend implementation)
function decryptApiKey(encryptedKey: string): string {
  try {
    const ENCRYPTION_KEY = 'medtech-api-key-2024';
    
    // If key looks like a plain text API key, return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || 
        encryptedKey.startsWith('gpt-') || encryptedKey.length < 20) {
      return encryptedKey;
    }

    // Reverse the process: base64 decode then XOR decrypt
    const base64Decoded = atob(encryptedKey);
    const decrypted = Array.from(base64Decoded)
      .map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return encryptedKey;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, imageLinks = 5, numResults = 3, companyId } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get SerpAPI key from company settings (prioritize serpapi specifically)
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('encrypted_key')
      .eq('company_id', companyId)
      .eq('key_type', 'serpapi')
      .limit(1)
      .single()

    if (apiKeyError || !apiKeyData) {
      console.log('No API key found for company:', companyId)
      
      return new Response(
        JSON.stringify({
          error: 'no_api_key',
          message: 'No SerpAPI key found. Please add your SerpAPI key in Company Settings to enable real image search.',
          details: 'Go to Company Settings > General > API Keys and add a SerpAPI key to get real Google Images results instead of demo data.',
          action_required: 'add_serpapi_key'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Decrypt the API key
    const serpApiKey = decryptApiKey(apiKeyData.encrypted_key)
    console.log('Decrypted key starts with:', serpApiKey.substring(0, 10) + '...')

    // Validate that this looks like a SerpAPI key
    if (!serpApiKey || serpApiKey.length < 20) {
      console.log('Invalid SerpAPI key format')
      // Return error message about wrong key type
      return new Response(
        JSON.stringify({
          error: 'Invalid API key format. Please add a valid SerpAPI key in Company Settings.',
          details: 'The current key appears to be a Google/Gemini key, but this function requires a SerpAPI key.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Make request to SerpAPI Google Images
    const serpApiUrl = new URL('https://serpapi.com/search')
    serpApiUrl.searchParams.set('engine', 'google_images')
    serpApiUrl.searchParams.set('q', query)
    serpApiUrl.searchParams.set('num', Math.min(imageLinks, 20).toString()) // SerpAPI max is 20
    serpApiUrl.searchParams.set('api_key', serpApiKey)
    // Filter for product images to get better results for medical devices
    serpApiUrl.searchParams.set('tbs', 'itp:product')
    // Use safe search
    serpApiUrl.searchParams.set('safe', 'active')

    console.log('Making SerpAPI request:', serpApiUrl.toString().replace(serpApiKey, '***'))

    const serpResponse = await fetch(serpApiUrl.toString())
    
    if (!serpResponse.ok) {
      throw new Error(`SerpAPI request failed: ${serpResponse.status} ${serpResponse.statusText}`)
    }

    const serpData = await serpResponse.json()

    if (serpData.error) {
      throw new Error(`SerpAPI error: ${serpData.error}`)
    }

    // Transform SerpAPI response to match our expected format
    const imageResults = serpData.images_results || []
    
    const results = [{
      title: `${query} - Google Images Results`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
      snippet: `Image search results for ${query}`,
      imageLinks: imageResults.slice(0, imageLinks).map((img: any) => img.original || img.thumbnail)
    }]

    const response = {
      results,
      query,
      totalResults: imageResults.length,
      serpapi_used: true
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in websearch function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while searching',
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})