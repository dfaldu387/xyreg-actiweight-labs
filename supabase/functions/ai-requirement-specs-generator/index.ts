import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define all available requirement categories
const ALL_REQUIREMENT_CATEGORIES = [
  'System use',
  'Safety',
  'Risk control',
  'Usability',
  'Regulatory',
  'Lifetime',
  'Environmental',
  'Packaging',
  'Mechanical',
  'Electronics',
  'Software',
  'User documentation'
];

interface RequirementSpecsSuggestionRequest {
  companyId: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
  userNeeds: Array<{
    id: string;
    user_need_id: string;
    description: string;
  }>;
  selectedCategories: string[];
}

interface RequirementSpecification {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ai-requirement-specs-generator] Starting requirement specifications generation');
    
    const requestBody = await req.json();
    console.log('[ai-requirement-specs-generator] Request body:', JSON.stringify(requestBody));

    const { companyId, productData, userNeeds, existingItems } = requestBody;

    if (!companyId || !productData || !userNeeds?.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: companyId, productData, and userNeeds'
      }), {
        status: 200,
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
      console.error('[ai-requirement-specs-generator] No Gemini API key found for company:', companyId);
      return new Response(JSON.stringify({
        success: false,
        error: 'No Gemini API key configured for this company. Please add one in Settings > API Keys.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt the API key using the same logic as user needs
    function decryptApiKey(encryptedKey: string): string {
      try {
        const ENCRYPTION_KEY = 'medtech-api-key-2024';
        
        if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-') || encryptedKey.startsWith('claude-')) {
          return encryptedKey;
        }

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
    
    const apiKey = decryptApiKey(apiKeyData.encrypted_key);
    console.log('[ai-requirement-specs-generator] API key found, length:', apiKey.length, 'starts with:', apiKey.substring(0, 6));

    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING REQUIREMENTS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map((item: string) => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW requirements that are substantially different from the above.`
      : '';

    // Simplified prompt similar to user needs
    const prompt = `You are a medical device expert tasked with generating requirement specifications for a medical device. Based on the product and user needs provided, generate specific, testable requirements.${existingItemsSection}

Product Information:
- Product Name: ${productData.product_name || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}

User Needs to trace to:
${userNeeds.slice(0, 8).map(need => `${need.user_need_id}: ${need.description}`).join('\n')}

Please generate 6-10 requirement specifications that are specific, measurable, and testable. Each requirement should:
1. Be technically precise and verifiable
2. Trace to at least one of the user needs above
3. Include clear acceptance criteria
4. Consider safety, performance, and usability aspects

For each requirement, provide:
- description: A clear, testable requirement statement
- category: One of "Safety", "Performance", "Usability", "Regulatory", "Environmental", "Software", "Mechanical"
- rationale: Why this requirement is necessary
- traces_to: Which user need ID this traces to (e.g., "UN-001")
- linked_risks: Brief description of risks this addresses
- acceptance_criteria: How to verify compliance
- confidence: Number between 0.8 and 1.0

Return your response as a JSON array of objects. Do not include any other text or formatting.`;

    console.log('[ai-requirement-specs-generator] Calling Gemini API');

    // Call Gemini API without timeout (like user needs)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
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
          maxOutputTokens: 4096,
        }
      }),
    });

    console.log(`[ai-requirement-specs-generator] Gemini API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-requirement-specs-generator] Gemini API error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('[ai-requirement-specs-generator] Received response from Gemini');

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('[ai-requirement-specs-generator] No text content in response:', JSON.stringify(data));
      return new Response(JSON.stringify({
        success: false,
        error: 'No content generated by AI'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('[ai-requirement-specs-generator] AI Response:', aiResponse);

    // Parse the AI response like user needs function
    let suggestions: RequirementSpecification[];
    try {
      // Clean the response - remove any markdown formatting
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanResponse);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('[ai-requirement-specs-generator] Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to parse AI response'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ai-requirement-specs-generator] Successfully generated', suggestions.length, 'suggestions');

    return new Response(JSON.stringify({
      success: true,
      suggestions: suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        productName: productData.product_name,
        totalSuggestions: suggestions.length,
        categoriesGenerated: [...new Set(suggestions.map(s => s.category))]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-requirement-specs-generator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});