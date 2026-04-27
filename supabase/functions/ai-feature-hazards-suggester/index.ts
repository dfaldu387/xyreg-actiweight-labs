import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const HAZARD_CATEGORIES = [
  'Mechanical', 'Electrical', 'Thermal', 'Radiation', 'Biological', 'Chemical',
  'Software', 'Use Error', 'Environmental', 'Measurement', 'Information', 'Other'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      requirementDescription,
      requirementType,
      productName,
      productContext,
      existingHazardDescriptions = [],
    } = await req.json();

    if (!requirementDescription || typeof requirementDescription !== 'string') {
      return new Response(
        JSON.stringify({ error: 'requirementDescription is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const existingList = existingHazardDescriptions.length > 0
      ? existingHazardDescriptions.slice(0, 40).map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')
      : '(none yet)';

    const ctxLines: string[] = [];
    if (productContext?.clinical_purpose) ctxLines.push(`Clinical purpose: ${productContext.clinical_purpose}`);
    if (productContext?.indications_for_use) ctxLines.push(`Indications: ${productContext.indications_for_use}`);
    if (productContext?.use_environment) ctxLines.push(`Use environment: ${productContext.use_environment}`);
    if (productContext?.target_population) ctxLines.push(`Target population: ${productContext.target_population}`);
    if (productContext?.device_class) ctxLines.push(`Device class: ${productContext.device_class}`);
    const ctxStr = ctxLines.length > 0 ? ctxLines.join('\n') : '(no product context provided)';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a medical device risk management expert specializing in ISO 14971 hazard analysis. Given a ${requirementType || 'system'} requirement and the product context, propose 2-4 plausible hazards that this requirement is intended to mitigate, OR hazards that the requirement could introduce if poorly implemented.

Each hazard description must be a concise, specific clinical/technical statement (e.g. "Sensor reading drift causes incorrect dosage display", "Alarm not audible in noisy clinical environment"). Avoid generic phrasings.

Categories available: ${HAZARD_CATEGORIES.join(', ')}.

Bias your suggestions toward NOVEL hazards not already in the existing register. If a clearly relevant existing hazard exists, you may still suggest it (the caller will fuzzy-match and offer a Link action).

Return suggestions using the suggest_hazards tool.`
          },
          {
            role: 'user',
            content: `Medical device: ${productName || 'Unknown device'}

Product context:
${ctxStr}

Requirement (${requirementType || 'system'}):
${requirementDescription}

Existing hazards already in the register:
${existingList}

Suggest 2-4 hazards relevant to this requirement.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_hazards',
              description: 'Return 2-4 hazard suggestions relevant to the given requirement.',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        description: { type: 'string', description: 'Concise hazard statement' },
                        category: { type: 'string', enum: HAZARD_CATEGORIES },
                        rationale: { type: 'string', description: 'Brief explanation of why this hazard relates to the requirement' }
                      },
                      required: ['description', 'category', 'rationale'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_hazards' } },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const errorText = await response.text();
      console.error('[ai-feature-hazards-suggester] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('No tool call response from AI');
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ suggestions: parsed.suggestions || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ai-feature-hazards-suggester] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});