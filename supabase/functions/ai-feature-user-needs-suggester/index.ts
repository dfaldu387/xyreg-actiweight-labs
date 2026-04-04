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
    const { featureName, featureDescription, productName } = await req.json();

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
            content: `You are a medical device regulatory expert specializing in ISO 13485 user needs traceability. Given a key feature of a medical device, suggest 3-5 user needs that this feature should trace to. Each user need should be a clear statement of what the user (clinician, patient, caregiver, etc.) needs.

Categories available: General, Safety, Performance, Usability, Interface, Design, Regulatory, Genesis, Document Management, Supplier, Training

Return suggestions using the suggest_user_needs tool.`
          },
          {
            role: 'user',
            content: `Medical device: ${productName || 'Unknown device'}
Feature name: ${featureName}
Feature description: ${featureDescription || 'No description provided'}

Suggest user needs that this feature should trace to.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_user_needs',
              description: 'Return 3-5 user need suggestions for the given feature.',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        description: { type: 'string', description: 'The user need statement' },
                        category: { type: 'string', enum: ['General', 'Safety', 'Performance', 'Usability', 'Interface', 'Design', 'Regulatory', 'Genesis', 'Document Management', 'Supplier', 'Training'] },
                        rationale: { type: 'string', description: 'Brief explanation of why this feature maps to this user need' }
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
        tool_choice: { type: 'function', function: { name: 'suggest_user_needs' } },
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
      console.error('[ai-feature-user-needs-suggester] API error:', response.status, errorText);
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
    console.error('[ai-feature-user-needs-suggester] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
