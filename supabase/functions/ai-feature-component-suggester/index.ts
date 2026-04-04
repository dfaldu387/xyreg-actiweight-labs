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
    const { featureName, featureDescription, productName, componentNames } = await req.json();

    if (!featureName || !componentNames?.length) {
      return new Response(
        JSON.stringify({ error: 'featureName and componentNames are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const componentList = componentNames.map((c: { name: string; description: string }) =>
      `- "${c.name}"${c.description ? `: ${c.description}` : ''}`
    ).join('\n');

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
            content: `You are a medical device design traceability expert. Given a key feature of a medical device and a list of available device components (hardware, software, sub-assemblies), you must:

1. **First**, select existing components from the provided list that are most relevant to implementing or supporting this feature. Only select components that have a clear functional relationship.

2. **Second**, identify any important components that are MISSING from the provided list but SHOULD exist to properly implement this feature. For each missing component, suggest a name, brief description, and component type (hardware, software, or sub_assembly).

Return your analysis using the suggest_components tool.`
          },
          {
            role: 'user',
            content: `Medical device: ${productName || 'Unknown device'}
Feature name: ${featureName}
Feature description: ${featureDescription || 'No description provided'}

Available components:
${componentList}

Which existing components are relevant, and what components are missing?`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_components',
              description: 'Return relevant existing components and suggest missing ones.',
              parameters: {
                type: 'object',
                properties: {
                  existingSuggestions: {
                    type: 'array',
                    description: 'Components from the provided list that are relevant to the feature',
                    items: {
                      type: 'object',
                      properties: {
                        componentName: { type: 'string', description: 'Exact name of the component from the provided list' },
                        rationale: { type: 'string', description: 'Brief explanation of why this component is relevant' }
                      },
                      required: ['componentName', 'rationale'],
                      additionalProperties: false
                    }
                  },
                  newSuggestions: {
                    type: 'array',
                    description: 'Components that should exist but are missing from the list',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Suggested name for the new component' },
                        description: { type: 'string', description: 'Brief description of what this component does' },
                        component_type: { type: 'string', enum: ['hardware', 'software', 'sub_assembly'], description: 'Type of component' },
                        rationale: { type: 'string', description: 'Why this component is needed for the feature' }
                      },
                      required: ['name', 'description', 'component_type', 'rationale'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['existingSuggestions', 'newSuggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_components' } },
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
      console.error('[ai-feature-component-suggester] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('No tool call response from AI');
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Validate existing suggestions against actual component names
    const validNames = new Set(componentNames.map((c: { name: string }) => c.name));
    const existingSuggestions = (parsed.existingSuggestions || []).filter(
      (s: { componentName: string }) => validNames.has(s.componentName)
    );

    return new Response(
      JSON.stringify({
        suggestions: existingSuggestions,
        newSuggestions: parsed.newSuggestions || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ai-feature-component-suggester] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
