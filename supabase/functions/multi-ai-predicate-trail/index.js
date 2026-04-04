import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple decryption function
function decryptApiKey(encryptedKey: string): string {
  const ENCRYPTION_KEY = 'medtech-api-key-2024';
  
  try {
    // If key looks like a plain text API key, return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-') || encryptedKey.startsWith('cl-')) {
      return encryptedKey;
    }

    // Decrypt
    const base64Decoded = atob(encryptedKey);
    const decrypted = Array.from(base64Decoded)
      .map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedKey;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kNumber, companyId } = await req.json();
    
    console.log(`[MULTI-AI] Starting analysis for K${kNumber}, Company: ${companyId}`);

    if (!kNumber || !companyId) {
      console.error('[MULTI-AI] Missing required parameters');
      return new Response(JSON.stringify({
        success: false,
        error: 'K-number and company ID are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle demo company ID
    if (companyId === 'demo-company-id') {
      console.log('[MULTI-AI] Using demo mode - no AI providers available');
      return new Response(JSON.stringify({
        success: true,
        data: {
          trails: [],
          consensus: {
            commonFindings: [],
            conflicts: [],
            recommendedProvider: null
          }
        },
        message: 'Demo mode - Please configure AI API keys for full analysis'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get API keys
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[MULTI-AI] Fetching API keys...');
    const { data: apiKeys, error: apiError } = await supabase
      .from('company_api_keys')
      .select('key_type, encrypted_key')
      .eq('company_id', companyId);

    if (apiError) {
      console.error('[MULTI-AI] API key fetch error:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error fetching API keys: ' + apiError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('[MULTI-AI] No API keys configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'No AI API keys configured for this company'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MULTI-AI] Found ${apiKeys.length} API keys`);

    // Get device info from FDA
    console.log('[MULTI-AI] Fetching FDA device info...');
    let deviceInfo = null;
    try {
      const fdaResponse = await fetch(`https://api.fda.gov/device/510k.json?search=k_number:${kNumber}&limit=1`);
      if (fdaResponse.ok) {
        const fdaData = await fdaResponse.json();
        deviceInfo = fdaData.results?.[0] || null;
        console.log('[MULTI-AI] FDA device info retrieved');
      } else {
        console.log('[MULTI-AI] FDA API returned non-OK status:', fdaResponse.status);
      }
    } catch (fdaError) {
      console.error('[MULTI-AI] FDA API error:', fdaError);
    }

    const trails = [];

    // Process each API key
    for (const apiKeyRecord of apiKeys) {
      console.log(`[MULTI-AI] Processing ${apiKeyRecord.key_type} key...`);
      
      try {
        const decryptedKey = decryptApiKey(apiKeyRecord.encrypted_key);
        
        if (!decryptedKey || decryptedKey.trim().length === 0) {
          console.log(`[MULTI-AI] Invalid key for ${apiKeyRecord.key_type}, skipping`);
          continue;
        }

        let analysis = '';
        
        if (apiKeyRecord.key_type === 'gemini') {
          console.log('[MULTI-AI] Calling Gemini API...');
          const prompt = `Provide FDA 510(k) predicate device trail for K${kNumber}. Show the complete predicate chain with specific K-numbers, device names, applicants, and clearance dates for each level. Start with K${kNumber} as Level 0 and work backwards through its predicate devices.`;
          
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${decryptedKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ 
                  text: prompt 
                }],
                role: "user"
              }],
              generationConfig: {
                maxOutputTokens: 2048,
                candidateCount: 1
              },
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH", 
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_NONE"
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_NONE"
                }
              ]
            })
          });

          console.log('[MULTI-AI] Gemini response status:', geminiResponse.status);
          
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';
            console.log('[MULTI-AI] Gemini analysis successful, length:', analysis.length);
          } else {
            const errorText = await geminiResponse.text();
            console.error('[MULTI-AI] Gemini API error:', geminiResponse.status, errorText);
          }
        }

        if (analysis && analysis.trim().length > 0) {
          trails.push({
            targetDevice: {
              kNumber,
              deviceName: deviceInfo?.device_name || 'Unknown Device',
              manufacturer: deviceInfo?.applicant || 'Unknown Manufacturer',
              clearanceDate: deviceInfo?.decision_date || 'Unknown'
            },
            branches: [],
            summary: analysis,
            analysisDate: new Date().toISOString(),
            provider: apiKeyRecord.key_type,
            confidence: 0.9
          });
          console.log(`[MULTI-AI] Added trail for ${apiKeyRecord.key_type}`);
        } else {
          console.log(`[MULTI-AI] No analysis generated for ${apiKeyRecord.key_type}`);
        }

      } catch (error) {
        console.error(`[MULTI-AI] Error processing ${apiKeyRecord.key_type}:`, error);
      }
    }

    console.log(`[MULTI-AI] Completed analysis, returning ${trails.length} trails`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        trails,
        consensus: {
          commonFindings: [],
          conflicts: [],
          recommendedProvider: trails.length > 0 ? trails[0].provider : undefined
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MULTI-AI] Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});