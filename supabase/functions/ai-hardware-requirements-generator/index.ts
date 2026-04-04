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
    
    console.log('[ai-hardware-requirements-generator] Starting hardware requirements generation');
    console.log('[ai-hardware-requirements-generator] Request:', {
      companyId,
      productName: productData.product_name,
      systemRequirementsCount: systemRequirements.length,
      selectedCategories
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[ai-hardware-requirements-generator] API key found, calling Lovable AI Gateway');

    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING HARDWARE REQUIREMENTS (DO NOT suggest these again or anything semantically equivalent):\n${existingItems.map((item: string) => `- "${item}"`).join('\n')}\n\nGenerate ONLY NEW requirements that are substantially different from the above.`
      : '';

    // Build system prompt for hardware requirements AI role as "hardware lead"
    const systemPrompt = `You are a Hardware Lead for medical device development. Your role is to translate system requirements into specific, actionable hardware requirements that implement those system capabilities.${existingItemsSection}

CONTEXT:
- Device: ${productData.product_name || 'Medical Device'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}

SYSTEM REQUIREMENTS TO IMPLEMENT:
${systemRequirements.map((sr: SystemRequirement) => `${sr.requirement_id}: ${sr.description}`).join('\n')}

HARDWARE LEAD PRINCIPLES:
1. Break down system requirements into implementable hardware specifications
2. Each hardware requirement MUST trace back to specific system requirements
3. Focus on electrical, mechanical, and physical specifications
4. Include IEC 60601-1 electrical safety requirements where relevant
5. Consider biocompatibility (ISO 10993) for patient-contacting parts
6. Address electromagnetic compatibility (EMC) requirements
7. Include environmental and durability specifications

IEC 60601-1 CONTEXT:
- Basic safety and essential performance requirements
- Patient protection from electrical hazards
- EMC requirements for medical electrical equipment
- Risk management integration (ISO 14971)
- Usability engineering (IEC 62366-1)

CATEGORIES TO FOCUS ON:
${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Electrical, Mechanical, Environmental, Safety, Performance, Materials'}

Generate 5-8 hardware requirements that implement the provided system requirements. Each requirement should be:
- Specific to hardware implementation
- Clearly linked to system requirements via traces_to field
- Include hardware-specific acceptance criteria and test methods
- Consider IEC 60601-1 and ISO 10993 compliance where applicable

Return ONLY a JSON array with this exact structure:
[
  {
    "description": "The hardware shall...",
    "category": "Electrical|Mechanical|Environmental|Safety|Performance|Materials",
    "rationale": "This hardware requirement implements system requirement SR-XXX by...",
    "traces_to": "SR-001, SR-003",
    "linked_risks": "Hardware failure modes or safety concerns",
    "acceptance_criteria": "Specific hardware testing criteria and standards",
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
          { role: 'user', content: 'Generate hardware requirements that implement these system requirements following IEC 60601-1 and ISO 10993 standards.' }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('[ai-hardware-requirements-generator] Lovable AI Gateway response status:', response.status);

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
      console.error('[ai-hardware-requirements-generator] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ai-hardware-requirements-generator] Received response from Lovable AI');

    // Track token usage in background
    const usage = extractLovableAIUsage(data);
    if (usage && companyId) {
      EdgeRuntime.waitUntil(
        trackTokenUsage(companyId, 'gemini', usage)
      );
    }

    const aiResponse = data.choices[0].message.content;
    console.log('[ai-hardware-requirements-generator] AI Response:', aiResponse);

    let suggestions;
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[ai-hardware-requirements-generator] No JSON array found in response');
        throw new Error('Invalid AI response format');
      }
    } catch (parseError) {
      console.error('[ai-hardware-requirements-generator] JSON parsing error:', parseError);
      throw new Error('Failed to parse AI response');
    }

    console.log('[ai-hardware-requirements-generator] Successfully generated', suggestions.length, 'suggestions');

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
    console.error('[ai-hardware-requirements-generator] Error:', error);
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