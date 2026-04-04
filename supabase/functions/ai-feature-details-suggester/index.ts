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
    const { featureName, productName } = await req.json();

    if (!featureName) {
      return new Response(
        JSON.stringify({ error: 'featureName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
            content: `You are a medical device regulatory expert specializing in EU MDR and ISO 13485 product development. Given a key feature of a medical device, provide:
1. A concise technical description of the feature (1-2 sentences, suitable for Annex II 1.1.f)
2. The most appropriate tag category for this feature
3. 2-4 clinical benefits this feature provides to patients/healthcare providers (suitable for Annex II 1.1.c)

Tags available: Safety, Connectivity, Novel, Performance, Usability, Monitoring, Clinical, Compliance

Return your suggestions using the suggest_feature_details tool.`
          },
          {
            role: 'user',
            content: `Medical device: ${productName || 'Unknown device'}
Feature name: ${featureName}

Suggest a description, tag, and clinical benefits for this feature.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_feature_details',
              description: 'Return description, tag, and clinical benefit suggestions for the given feature.',
              parameters: {
                type: 'object',
                properties: {
                  description: { type: 'string', description: 'Concise technical description of the feature' },
                  tag: { type: 'string', enum: ['Safety', 'Connectivity', 'Novel', 'Performance', 'Usability', 'Monitoring', 'Clinical', 'Compliance'] },
                  clinicalBenefits: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        benefit: { type: 'string', description: 'The clinical benefit statement' },
                        rationale: { type: 'string', description: 'Brief explanation of why this feature provides this benefit' }
                      },
                      required: ['benefit', 'rationale'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['description', 'tag', 'clinicalBenefits'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_feature_details' } },
        temperature: 0.3,
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
      console.error('[ai-feature-details-suggester] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('No tool call response from AI');
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        description: parsed.description || '',
        tag: parsed.tag || '',
        clinicalBenefits: parsed.clinicalBenefits || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ai-feature-details-suggester] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
