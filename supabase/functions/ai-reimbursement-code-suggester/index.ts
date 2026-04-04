import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReimbursementCodeRequest {
  companyId: string;
  market: string;
  productData: {
    product_name?: string;
    intended_use?: string;
    device_type?: string;
    clinical_purpose?: string;
    indications_for_use?: string;
  };
}

interface CodeSuggestion {
  code: string;
  description: string;
  rationale: string;
  confidence: number;
  status: 'exact_match' | 'partial_match' | 'application_pending';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ReimbursementCodeRequest = await req.json();
    console.log('[ai-reimbursement-code-suggester] Request received:', {
      companyId: requestData.companyId,
      market: requestData.market,
      productName: requestData.productData.product_name
    });

    // Get company API key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('encrypted_key')
      .eq('company_id', requestData.companyId)
      .eq('key_type', 'gemini')
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('[ai-reimbursement-code-suggester] No Gemini API key found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Gemini API key not configured for this company',
          errorType: 'api_key_missing'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = apiKeyData.encrypted_key;

    // Build prompt based on market
    const prompt = buildPrompt(requestData.market, requestData.productData);

    console.log('[ai-reimbursement-code-suggester] Calling Gemini API');

    // Call Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-reimbursement-code-suggester] Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate suggestions from Gemini API',
          errorType: 'gemini_api_error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('[ai-reimbursement-code-suggester] No content generated');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No suggestions generated',
          errorType: 'no_content'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON response
    const suggestions: CodeSuggestion[] = parseGeminiResponse(generatedText);

    console.log('[ai-reimbursement-code-suggester] Generated', suggestions.length, 'suggestions');

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        metadata: {
          generatedAt: new Date().toISOString(),
          market: requestData.market,
          productName: requestData.productData.product_name,
          totalSuggestions: suggestions.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ai-reimbursement-code-suggester] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(market: string, productData: any): string {
  const marketInfo = getMarketSystemInfo(market);
  
  return `You are a medical device reimbursement expert. Suggest appropriate reimbursement codes for this device in the ${market} market.

DEVICE INFORMATION:
- Product Name: ${productData.product_name || 'N/A'}
- Intended Use: ${productData.intended_use || 'N/A'}
- Device Type: ${productData.device_type || 'N/A'}
- Clinical Purpose: ${productData.clinical_purpose || 'N/A'}
- Indications for Use: ${productData.indications_for_use || 'N/A'}

MARKET: ${market}
${marketInfo}

INSTRUCTIONS:
1. Suggest 2-4 most relevant reimbursement codes for this device
2. For each code, provide:
   - The actual code (e.g., "93000", "C1234", "EBM 31010")
   - A clear description of what the code covers
   - Rationale explaining why this code is appropriate for this device
   - Confidence level (0-100)
   - Status: "exact_match" (existing code applies perfectly), "partial_match" (existing code partially applies), or "application_pending" (new code may be needed)

Return your response as a JSON array with this structure:
[
  {
    "code": "CODE_HERE",
    "description": "Description of what this code covers",
    "rationale": "Why this code applies to this device",
    "confidence": 85,
    "status": "exact_match"
  }
]

Only return valid JSON. No markdown formatting.`;
}

function getMarketSystemInfo(market: string): string {
  const marketSystems: Record<string, string> = {
    'US': 'Reimbursement Systems: CPT (Current Procedural Terminology), HCPCS (Healthcare Common Procedure Coding System), DRG (Diagnosis-Related Groups). Focus on procedure codes and device-specific HCPCS codes.',
    'DE': 'Reimbursement Systems: EBM (Einheitlicher Bewertungsmaßstab), OPS (Operationen- und Prozedurenschlüssel), G-DRG (German Diagnosis-Related Groups). Focus on procedure codes and DRG relevance.',
    'FR': 'Reimbursement Systems: CCAM (Classification Commune des Actes Médicaux), GHS (Groupes Homogènes de Séjours). Focus on medical procedure codes.',
    'UK': 'Reimbursement Systems: OPCS-4 (Classification of Interventions and Procedures), HRG (Healthcare Resource Groups). Focus on procedure classifications.',
    'JP': 'Reimbursement System: Japanese Medical Fee Points system. Focus on procedure codes and device categories.',
    'AU': 'Reimbursement Systems: MBS (Medicare Benefits Schedule), AR-DRG (Australian Refined Diagnosis-Related Groups). Focus on procedure codes.',
    'CA': 'Reimbursement Systems: Provincial fee schedules, CCI (Canadian Classification of Health Interventions). Focus on procedure codes.',
    'BR': 'Reimbursement System: TUSS (Terminologia Unificada da Saúde Suplementar). Focus on procedure codes.',
    'CN': 'Reimbursement System: Chinese Medical Insurance Catalog. Focus on device categories and procedure types.'
  };

  return marketSystems[market] || 'General reimbursement code systems for medical devices.';
}

function parseGeminiResponse(text: string): CodeSuggestion[] {
  try {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedText);
    
    if (!Array.isArray(parsed)) {
      console.error('[ai-reimbursement-code-suggester] Response is not an array');
      return [];
    }

    return parsed.filter(s => s.code && s.description && s.rationale);
  } catch (error) {
    console.error('[ai-reimbursement-code-suggester] Failed to parse response:', error);
    return [];
  }
}
