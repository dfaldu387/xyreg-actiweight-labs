import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface UserNeed {
  user_need_id: string;
  description: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, productData, userNeeds, selectedCategories, additionalPrompt, outputLanguage, existingItems } = await req.json();
    
    console.log('[ai-system-requirements-generator] Starting system requirements generation');
    console.log('[ai-system-requirements-generator] Request:', {
      companyId,
      productName: productData.product_name,
      userNeedsCount: userNeeds.length,
      selectedCategories
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[ai-system-requirements-generator] API key found, calling Lovable AI Gateway');

    // Build system prompt for system requirements AI role as "system architect"
    const hasUserNeeds = userNeeds && userNeeds.length > 0;
    
    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING REQUIREMENTS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map((item: string) => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW requirements that are substantially different from the above.`
      : '';

    let systemPrompt;
    if (hasUserNeeds) {
      systemPrompt = `You are a System Architect for medical device development. Your role is to translate user needs into measurable, testable system requirements that can be implemented by engineering teams.${existingItemsSection}

CONTEXT:
- Device: ${productData.product_name || 'Medical Device'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

USER NEEDS TO DERIVE FROM:
${userNeeds.map((un: UserNeed) => `${un.user_need_id}: ${un.description}`).join('\n')}

SYSTEM ARCHITECT PRINCIPLES:
1. Translate qualitative user needs into quantitative, measurable system requirements
2. Each system requirement MUST trace back to specific user needs
3. Focus on what the system must do, not how it does it
4. Include performance, safety, usability, and compliance requirements
5. Make requirements testable and verifiable
6. Consider industry standards (ISO 13485, IEC 60601 family)

CATEGORIES TO FOCUS ON:
${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Safety, Performance, Usability, Environmental, Compliance'}

Generate 5-8 system requirements that derive from the provided user needs. Each requirement should be:
- Specific and measurable
- Clearly linked to user needs via traces_to field
- Include acceptance criteria that can be tested
- Consider potential risks that need to be addressed`;
    } else {
      systemPrompt = `You are a System Architect for medical device development. Your role is to generate fundamental system requirements for medical devices based on industry standards and best practices.${existingItemsSection}

CONTEXT:
- Device: ${productData.product_name || 'Medical Device'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

SYSTEM ARCHITECT PRINCIPLES:
1. Generate fundamental system requirements based on medical device standards
2. Focus on what the system must do, not how it does it
3. Include performance, safety, usability, and compliance requirements
4. Make requirements testable and verifiable
5. Consider industry standards (ISO 13485, IEC 60601 family)
6. Generate requirements that are applicable to most medical devices

CATEGORIES TO FOCUS ON:
${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Safety, Performance, Usability, Environmental, Compliance'}

Generate 5-8 fundamental system requirements for this medical device. Each requirement should be:
- Specific and measurable
- Based on medical device industry standards
- Include acceptance criteria that can be tested
- Consider potential risks that need to be addressed`;
    }

    // Build the traces_to example from actual user need IDs
    const tracesToExample = hasUserNeeds
      ? userNeeds.slice(0, 3).map((un: UserNeed) => un.user_need_id).join(', ')
      : '';
    const tracesToInstruction = hasUserNeeds
      ? `"traces_to": "${tracesToExample}" (use ONLY actual user need IDs from the list above, comma-separated)`
      : `"traces_to": "" (leave empty string - no user needs provided; put standard references in rationale instead)`;

    systemPrompt += `

Return ONLY a JSON array with this exact structure:
[
  {
    "description": "The system shall...",
    "category": "Safety|Performance|Usability|Environmental|Compliance",
    "rationale": "This requirement ensures that... (include applicable standards like IEC 60601-1, ISO 14971 here)",
    ${tracesToInstruction},
    "linked_risks": "Potential failure modes or safety concerns",
    "acceptance_criteria": "Specific, measurable criteria for verification",
    "confidence": 0.85
  }
]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: hasUserNeeds 
            ? 'Generate system requirements derived from these user needs following medical device development best practices.' 
            : 'Generate fundamental system requirements for this medical device following industry standards and best practices.' }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('[ai-system-requirements-generator] Lovable AI Gateway response status:', response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Rate limits exceeded, please try again later.",
          errorType: "rate_limit"
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Payment required, please add funds to your Lovable AI workspace.",
          errorType: "payment_required"
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[ai-system-requirements-generator] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ai-system-requirements-generator] Received response from Lovable AI');

    const aiResponse = data.choices[0].message.content;
    console.log('[ai-system-requirements-generator] AI Response:', aiResponse);

    let suggestions;
    try {
      // Try to extract JSON from markdown code blocks first
      const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        suggestions = JSON.parse(codeBlockMatch[1]);
        console.log('[ai-system-requirements-generator] Parsed from code block:', suggestions.length, 'suggestions');
      } else {
        // Try to find JSON array directly
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
          console.log('[ai-system-requirements-generator] Parsed from JSON array:', suggestions.length, 'suggestions');
        } else {
          console.error('[ai-system-requirements-generator] No JSON array found in response');
          console.error('[ai-system-requirements-generator] Response content:', aiResponse);
          throw new Error('Invalid AI response format');
        }
      }

      if (!Array.isArray(suggestions)) {
        console.error('[ai-system-requirements-generator] Parsed result is not an array:', typeof suggestions);
        throw new Error('AI response is not a valid array');
      }

    } catch (parseError) {
      console.error('[ai-system-requirements-generator] JSON parsing error:', parseError);
      console.error('[ai-system-requirements-generator] Raw AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    console.log('[ai-system-requirements-generator] Successfully generated', suggestions.length, 'suggestions');

    return new Response(JSON.stringify({
      success: true,
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        productName: productData.product_name,
        totalSuggestions: suggestions.length,
        categoriesGenerated: [...new Set(suggestions.map((s: any) => s.category))]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-system-requirements-generator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});