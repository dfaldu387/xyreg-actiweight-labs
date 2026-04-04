import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, productData, scopeType, familyProducts } = await req.json();
    const isFamily = scopeType === 'product_family' && familyProducts?.length > 0;
    console.log('[ai-vv-plan-generator] Request received:', { companyId, productName: productData?.product_name, scopeType, familyCount: familyProducts?.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = `You are a medical device V&V (Verification & Validation) planning expert with deep knowledge of IEC 62304, ISO 13485, ISO 14971, and FDA 21 CFR Part 820.

Given information about a medical device product, generate a comprehensive V&V plan by calling the generate_vv_plan function. Your suggestions should be specific to the device type, risk class, and intended use provided.

Guidelines:
- Name should be specific to the product (e.g., "V&V Plan - [Product Name]")
- Description should summarize the verification and validation strategy
- Scope should cover all applicable V&V activities based on device class and markets
- Select appropriate methodologies (inspection, analysis, test, demonstration)
- Select appropriate test levels (unit, integration, system, validation)
- Acceptance criteria should be measurable and tied to requirements
- Roles should reflect a typical medtech QMS organization`;

    if (isFamily) {
      systemPrompt += `\n\nIMPORTANT: This plan covers an entire product family sharing one Basic UDI-DI. You must:
- Name the plan for the product family, not a single variant
- Define scope covering ALL variants in the family
- Address shared verification activities that apply to the common platform
- Call out variant-specific validation needs where device class or intended use differs
- Use the highest device class in the family to determine the rigor of the V&V strategy`;
    }

    let userPrompt = `Generate a V&V plan for the following medical device:

Product Name: ${productData.product_name || 'Unknown'}
Device Class: ${productData.device_class || 'Not specified'}
Intended Use: ${productData.clinical_purpose || productData.intended_purpose || 'Not specified'}
Target Markets: ${productData.markets?.map((m: any) => m.name || m).join(', ') || 'Not specified'}
Number of Requirements: ${productData.requirements_count || 0}
Number of Hazards: ${productData.hazards_count || 0}`;

    if (isFamily) {
      const variantList = familyProducts.map((p: any) => 
        `${p.name} (Class: ${p.device_class || 'N/A'}, Intended Use: ${p.intended_purpose || 'N/A'})`
      ).join('\n- ');
      userPrompt += `\n\nProduct Family Variants (${familyProducts.length} total):\n- ${variantList}`;
    }

    console.log('[ai-vv-plan-generator] Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_vv_plan",
              description: "Generate a structured V&V plan for a medical device product",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "V&V plan name" },
                  description: { type: "string", description: "Brief description of the V&V strategy" },
                  scope: { type: "string", description: "Scope of V&V activities" },
                  methodology: {
                    type: "array",
                    items: { type: "string", enum: ["inspection", "analysis", "test", "demonstration"] },
                    description: "Selected methodologies"
                  },
                  test_levels: {
                    type: "array",
                    items: { type: "string", enum: ["unit", "integration", "system", "validation"] },
                    description: "Selected test levels"
                  },
                  acceptance_criteria: { type: "string", description: "Acceptance criteria text" },
                  roles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string" },
                        responsibility: { type: "string" }
                      },
                      required: ["role", "responsibility"],
                      additionalProperties: false
                    },
                    description: "Roles and responsibilities"
                  }
                },
                required: ["name", "description", "scope", "methodology", "test_levels", "acceptance_criteria", "roles"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_vv_plan" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[ai-vv-plan-generator] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ai-vv-plan-generator] Response received');

    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('[ai-vv-plan-generator] No tool call in response');
      throw new Error('AI did not return structured output');
    }

    const plan = JSON.parse(toolCall.function.arguments);
    console.log('[ai-vv-plan-generator] Parsed plan:', plan.name);


    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-vv-plan-generator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
