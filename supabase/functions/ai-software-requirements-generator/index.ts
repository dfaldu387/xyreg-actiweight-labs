import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trackTokenUsage, extractLovableAIUsage } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

interface SystemRequirement {
  requirement_id: string;
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
    const { companyId, productData, systemRequirements, selectedCategories, existingItems } = await req.json();
    
    console.log('[ai-software-requirements-generator] Starting software requirements generation');
    console.log('[ai-software-requirements-generator] Request:', {
      companyId,
      productName: productData.product_name,
      systemRequirementsCount: systemRequirements.length,
      selectedCategories
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[ai-software-requirements-generator] API key found, calling Lovable AI Gateway');

    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING SOFTWARE REQUIREMENTS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map((item: string) => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW requirements that are substantially different from the above.`
      : '';

    // Build system prompt for software requirements AI role as "software lead"
    const systemPrompt = `You are a Software Lead for medical device development. Your role is to translate system requirements into specific, actionable software requirements that implement those system capabilities.${existingItemsSection}

CONTEXT:
- Device: ${productData.product_name || 'Medical Device'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

SYSTEM REQUIREMENTS TO IMPLEMENT:
${systemRequirements.map((sr: SystemRequirement) => `${sr.requirement_id}: ${sr.description}`).join('\n')}

SOFTWARE LEAD PRINCIPLES:
1. Break down system requirements into implementable software functionality
2. Each software requirement MUST trace back to specific system requirements
3. Focus on software behavior, interfaces, and performance
4. Include IEC 62304 software safety classifications where relevant
5. Consider software architecture patterns for medical devices
6. Address cybersecurity requirements (FDA guidance on medical device cybersecurity)
7. Include software verification and validation requirements

IEC 62304 CONTEXT:
- Safety Classification: Class A (Non-safety), Class B (Non-life-threatening), Class C (Life-threatening)
- Software lifecycle processes must be followed
- Risk management integration required
- Documentation and traceability requirements

CATEGORIES TO FOCUS ON:
${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Functional, Interface, Performance, Security, Safety, Usability'}

Generate 5-8 software requirements that implement the provided system requirements. Each requirement should be:
- Specific to software implementation
- Clearly linked to system requirements via traces_to field
- Include software-specific acceptance criteria
- Consider IEC 62304 compliance where applicable

Return ONLY a JSON array with this exact structure:
[
  {
    "description": "The software shall...",
    "category": "Functional|Interface|Performance|Security|Safety|Usability",
    "rationale": "This software requirement implements system requirement SR-XXX by...",
    "traces_to": "SR-001, SR-003",
    "linked_risks": "Software failure modes or cybersecurity concerns",
    "acceptance_criteria": "Specific software testing criteria",
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
          { role: 'user', content: 'Generate software requirements that implement these system requirements following IEC 62304 and FDA cybersecurity guidance.' }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('[ai-software-requirements-generator] Lovable AI Gateway response status:', response.status);

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
      console.error('[ai-software-requirements-generator] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ai-software-requirements-generator] Received response from Lovable AI');

    // Track token usage in background
    const usage = extractLovableAIUsage(data);
    if (usage && companyId) {
      EdgeRuntime.waitUntil(
        trackTokenUsage(companyId, 'gemini', usage)
      );
    }

    const aiResponse = data.choices[0].message.content;
    console.log('[ai-software-requirements-generator] AI Response:', aiResponse);

    let suggestions;
    try {
      // Extract JSON from the response, handling markdown code blocks
      let jsonContent = aiResponse;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1];
      }
      
      // Look for JSON array
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[ai-software-requirements-generator] No JSON array found in response');
        console.error('[ai-software-requirements-generator] Full response:', aiResponse);
        throw new Error('Invalid AI response format');
      }
    } catch (parseError) {
      console.error('[ai-software-requirements-generator] JSON parsing error:', parseError);
      console.error('[ai-software-requirements-generator] Response content:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    console.log('[ai-software-requirements-generator] Successfully generated', suggestions.length, 'suggestions');

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
    console.error('[ai-software-requirements-generator] Error:', error);
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