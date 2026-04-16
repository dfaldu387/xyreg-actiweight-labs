import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple decryption function (matches frontend implementation)
function decryptApiKey(encryptedKey: string): string {
  try {
    const ENCRYPTION_KEY = 'medtech-api-key-2024';
    
    // If key looks like a plain text API key, return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-') || encryptedKey.startsWith('claude-')) {
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

interface UserNeedSuggestion {
  description: string;
  rationale: string;
  confidence: number;
  category?: string;
}

interface UserNeedsAIRequest {
  companyId: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
    markets?: any[];
    intended_purpose_data?: {
      clinicalPurpose?: string;
      indicationsForUse?: string;
      targetPopulation?: string;
      useEnvironment?: string;
      durationOfUse?: string;
    };
  };
  categories?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ai-user-needs-generator] Starting user needs generation');
    
    const requestBody = await req.json();
    const { additionalPrompt, outputLanguage, existingItems } = requestBody as { additionalPrompt?: string; outputLanguage?: string; existingItems?: string[] };
    console.log('[ai-user-needs-generator] Request body:', JSON.stringify(requestBody));

    const { companyId, productData } = requestBody;

    if (!companyId || !productData) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: companyId and productData'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with JWT from request
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Get API key from company_api_keys table
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('encrypted_key')
      .eq('company_id', companyId)
      .eq('key_type', 'gemini')
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('[ai-user-needs-generator] No Gemini API key found for company:', companyId);
      return new Response(JSON.stringify({
        error: 'No Gemini API key configured for this company. Please add one in Settings > API Keys.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(apiKeyData.encrypted_key);
    console.log('[ai-user-needs-generator] API key found, length:', apiKey.length, 'starts with:', apiKey.substring(0, 6));

    // Strip HTML tags from input text
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract product information (strip HTML to avoid confusing the model)
    const clinicalPurpose = stripHtml(productData.clinical_purpose ||
                           productData.intended_purpose_data?.clinicalPurpose || '');
    const indicationsForUse = stripHtml(productData.indications_for_use ||
                             productData.intended_purpose_data?.indicationsForUse || '');
    const targetPopulation = stripHtml(productData.target_population ||
                            productData.intended_purpose_data?.targetPopulation || '');
    const useEnvironment = stripHtml(productData.use_environment ||
                          productData.intended_purpose_data?.useEnvironment || '');
    const durationOfUse = stripHtml(productData.duration_of_use ||
                         productData.intended_purpose_data?.durationOfUse || '');

    // Extract target markets information (only selected markets)
    const markets = (productData.markets || []).filter((m: any) => m.selected !== false);
    const marketNames = markets
      .map((m: any) => m.name || m.market_code || m.code)
      .filter(Boolean)
      .join(', ');

    // Create market-specific context
    const marketContext = marketNames 
      ? `\n\nTarget Markets: ${marketNames}

IMPORTANT: Since this device will be marketed in ${marketNames}, include market-specific user needs related to:
- Regulatory compliance (e.g., FDA for USA, MDR/IVDR for EU, PMDA for Japan)
- Labeling requirements specific to each market
- Packaging requirements and standards
- Required clinical studies or testing for market approval
- Market-specific safety or performance standards
- Language and documentation requirements
- Post-market surveillance requirements
- Quality system requirements (e.g., ISO 13485, QSR for USA)` 
      : '';

    // Build existing items exclusion section
    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING USER NEEDS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map(item => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW user needs that are substantially different from the above.`
      : '';

    // Create prompt for AI
    const prompt = `You are a medical device expert tasked with identifying user needs for a medical device. Based on the product information provided, generate a comprehensive list of user needs that healthcare professionals and patients might have.

Product Information:
- Product Name: ${productData.product_name || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}
- Clinical Purpose: ${clinicalPurpose}
- Indications for Use: ${indicationsForUse}
- Target Population: ${targetPopulation}
- Use Environment: ${useEnvironment}
- Duration of Use: ${durationOfUse}${marketContext}${existingItemsSection}

Please generate 6-8 user needs that are specific, measurable, and relevant to this medical device. Each user need should:
1. Be written from the user's perspective (healthcare professional, patient, or regulatory stakeholder)
2. Be specific and actionable
3. Be relevant to the device's intended use and target markets
4. Consider safety, efficacy, usability, and regulatory requirements
${marketNames ? '5. Include market-specific regulatory and compliance needs for the target markets' : ''}

For each user need, provide:
- description: A clear, concise statement of the user need (max 2 sentences)
- rationale: Why this need is important (max 2 sentences)
- confidence: A number between 0.7 and 1.0 indicating how confident you are this is a valid need
- category: One of these categories: "Safety", "Efficacy", "Usability", "Training", "Maintenance", "Regulatory", "Performance"

IMPORTANT: Keep descriptions and rationale SHORT and concise. Do not use special characters like curly quotes. Return ONLY a valid JSON array.${outputLanguage && outputLanguage !== 'en' ? `\n\nIMPORTANT: Generate ALL output text (descriptions, rationale, etc.) in ${outputLanguage === 'de' ? 'German (Deutsch)' : outputLanguage === 'fr' ? 'French (Français)' : outputLanguage === 'fi' ? 'Finnish (Suomi)' : outputLanguage}. Keep JSON keys in English.` : ''}${additionalPrompt ? `\n\nAdditional instructions from the user:\n${additionalPrompt}` : ''}`;

    console.log('[ai-user-needs-generator] Calling Gemini API');

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      }),
    });

    console.log(`[ai-user-needs-generator] Gemini API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-user-needs-generator] Gemini API error:', errorText);
      return new Response(JSON.stringify({
        error: `Gemini API error: ${response.status} - ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('[ai-user-needs-generator] Received response from Gemini');

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('[ai-user-needs-generator] No text content in response:', JSON.stringify(data));
      return new Response(JSON.stringify({
        error: 'No content generated by AI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('[ai-user-needs-generator] AI Response:', aiResponse);

    // Sanitize common JSON issues from Gemini output
    const sanitizeJson = (text: string): string => {
      return text
        // Replace smart/curly quotes with standard quotes
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        // Replace en/em dashes with regular hyphens
        .replace(/[\u2013\u2014]/g, '-')
        // Remove zero-width characters
        .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
        // Fix unescaped newlines inside JSON strings
        .replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n')
        // Strip markdown code blocks
        .replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')
        .trim();
    };

    // Parse the AI response
    let suggestions: UserNeedSuggestion[];
    try {
      let parsed: any;
      // Try direct parse first
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        // Sanitize and retry
        let cleaned = sanitizeJson(aiResponse);
        // Extract JSON array if surrounded by other text
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          cleaned = arrayMatch[0];
        }
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Last resort: fix single quotes used as property delimiters
          cleaned = cleaned.replace(/'/g, '"');
          parsed = JSON.parse(cleaned);
        }
      }

      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.data || []);

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Response is not a valid array of suggestions');
      }
    } catch (parseError) {
      console.error('[ai-user-needs-generator] Failed to parse AI response:', parseError);
      console.error('[ai-user-needs-generator] Raw response:', aiResponse.substring(0, 1000));
      return new Response(JSON.stringify({
        error: 'Failed to parse AI response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ai-user-needs-generator] Successfully generated', suggestions.length, 'suggestions');

    return new Response(JSON.stringify({
      suggestions: suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        productName: productData.product_name,
        totalSuggestions: suggestions.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-user-needs-generator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});