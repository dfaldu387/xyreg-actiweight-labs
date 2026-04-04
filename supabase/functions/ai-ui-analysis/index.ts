import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { imageUrl, productContext, mode = 'single' } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isGenerate = mode === 'generate';

    const systemPrompt = isGenerate
      ? `You are an expert in medical device usability engineering per IEC 62366-1 and ISO 14971.
You analyze user interface images of medical devices to identify ALL distinct UI characteristics visible.
For each characteristic found, assess its safety relevance and provide detailed analysis.
You must call the "ui_generation_result" function with your structured findings.

IMPORTANT: Classify each UI element into one of these IEC 62366-1 Clause 5.2 categories:
- "displays": Screens, monitors, readouts, digital displays, visual indicators showing information
- "controls": Buttons, knobs, switches, touchscreen controls, sliders, dials — anything the user manipulates
- "alarms": Audible or visual alerts, alarm indicators, warning lights, notification systems
- "labels": Text labels, markings, symbols, icons printed/etched on the device or packaging
- "connectors": Ports, cables, plugs, sockets, USB connectors, power connectors
- "other": Any UI element that doesn't fit the above categories

Guidelines:
- Identify every distinct UI element: displays, buttons, indicators, labels, alarms, controls, connectors, etc.
- Be specific about what you observe
- Each element should be a separate entry
- Reference IEC 62366-1 clauses where relevant
- Link potential hazards to ISO 14971 risk categories`
      : `You are an expert in medical device usability engineering per IEC 62366-1 and ISO 14971.
You analyze user interface images of medical devices to identify usability characteristics, safety relevance, and potential use-related hazards.

When analyzing an image, you must call the "ui_analysis_result" function with your structured findings.

IMPORTANT: Classify the UI element into one of these IEC 62366-1 Clause 5.2 categories:
- "displays": Screens, monitors, readouts, digital displays, visual indicators showing information
- "controls": Buttons, knobs, switches, touchscreen controls, sliders, dials — anything the user manipulates
- "alarms": Audible or visual alerts, alarm indicators, warning lights, notification systems
- "labels": Text labels, markings, symbols, icons printed/etched on the device or packaging
- "connectors": Ports, cables, plugs, sockets, USB connectors, power connectors
- "other": Any UI element that doesn't fit the above categories

Guidelines:
- Be specific about what you observe in the image
- Reference IEC 62366-1 clauses where relevant
- Consider cognitive load, visual design, physical interaction, and error prevention
- Link potential hazards to ISO 14971 risk categories
- Provide actionable recommendations`;

    const userPrompt = isGenerate
      ? `Analyze this medical device user interface image per IEC 62366-1.
${productContext ? `Product context: ${productContext}` : ''}

Identify ALL distinct UI characteristics visible in the image. For each one, provide:
1. A concise feature name
2. A description of the element and how users interact with it
3. Safety relevance assessment (critical/moderate/low)
4. Rationale for the safety assessment
5. Detailed analysis covering cognitive load, visual design hazards, physical interaction issues, and potential hazards

Return as many distinct features as you can identify.`
      : `Analyze this medical device user interface image per IEC 62366-1.
${productContext ? `Product context: ${productContext}` : ''}

Provide:
1. A concise feature name for the UI element
2. A description of what it is and how users interact with it
3. Safety relevance assessment (critical/moderate/low)
4. Rationale for the safety assessment
5. Detailed 62366-1 analysis covering cognitive load, visual design hazards, physical interaction issues, potential hazards with ISO 14971 linkage, and recommendations`;

    const detailedAnalysisSchema = {
      type: 'object',
      properties: {
        cognitive_load: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              details: { type: 'string' },
            },
            required: ['issue', 'severity', 'details'],
          },
        },
        visual_design_hazards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              details: { type: 'string' },
            },
            required: ['issue', 'severity', 'details'],
          },
        },
        physical_interaction: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              details: { type: 'string' },
            },
            required: ['issue', 'severity', 'details'],
          },
        },
        potential_hazards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hazard: { type: 'string' },
              usability_root_cause: { type: 'string' },
              potential_clinical_outcome: { type: 'string' },
            },
            required: ['hazard', 'usability_root_cause', 'potential_clinical_outcome'],
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['cognitive_load', 'visual_design_hazards', 'physical_interaction', 'potential_hazards', 'recommendations'],
    };

    const tools = isGenerate
      ? [{
          type: 'function',
          function: {
            name: 'ui_generation_result',
            description: 'Return an array of UI characteristics found in the image',
            parameters: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      feature_name: { type: 'string', description: 'Concise name for the UI feature/element' },
                      description: { type: 'string', description: 'Description of the UI element and user interaction' },
                      safety_relevance: { type: 'string', enum: ['critical', 'moderate', 'low'] },
                      category: { type: 'string', enum: ['displays', 'controls', 'alarms', 'labels', 'connectors', 'other'], description: 'IEC 62366-1 Clause 5.2 category' },
                      rationale: { type: 'string', description: 'Rationale for the safety relevance assessment' },
                      detailed_analysis: detailedAnalysisSchema,
                    },
                    required: ['feature_name', 'description', 'safety_relevance', 'category', 'rationale', 'detailed_analysis'],
                  },
                },
              },
              required: ['features'],
            },
          },
        }]
      : [{
          type: 'function',
          function: {
            name: 'ui_analysis_result',
            description: 'Return structured IEC 62366-1 UI analysis results',
            parameters: {
              type: 'object',
              properties: {
                feature_name: { type: 'string', description: 'Concise name for the UI feature/element' },
                description: { type: 'string', description: 'Description of the UI element and user interaction' },
                safety_relevance: { type: 'string', enum: ['critical', 'moderate', 'low'] },
                category: { type: 'string', enum: ['displays', 'controls', 'alarms', 'labels', 'connectors', 'other'], description: 'IEC 62366-1 Clause 5.2 category' },
                rationale: { type: 'string', description: 'Rationale for the safety relevance assessment' },
                detailed_analysis: detailedAnalysisSchema,
              },
              required: ['feature_name', 'description', 'safety_relevance', 'category', 'rationale', 'detailed_analysis'],
            },
          },
        }];

    const toolChoice = isGenerate
      ? { type: 'function', function: { name: 'ui_generation_result' } }
      : { type: 'function', function: { name: 'ui_analysis_result' } };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received, mode:', mode);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const expectedName = isGenerate ? 'ui_generation_result' : 'ui_analysis_result';
    if (!toolCall || toolCall.function.name !== expectedName) {
      throw new Error('Unexpected AI response format');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-ui-analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
