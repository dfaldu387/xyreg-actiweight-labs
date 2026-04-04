import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getFocusCategoryInstruction(category?: string): string {
  const map: Record<string, string> = {
    ui_display: '\n\nFOCUS: Concentrate specifically on UI and display-related hazards — misreading screens, confusing layouts, poor visual hierarchy, illegible text, misleading icons, and visual feedback failures.',
    controls_physical: '\n\nFOCUS: Concentrate specifically on controls and physical interaction hazards — hard-to-reach buttons, poor ergonomics, accidental activation, inadequate tactile feedback, and force/dexterity issues.',
    alarms_notifications: '\n\nFOCUS: Concentrate specifically on alarm and notification hazards — missed alarms, alarm fatigue, unclear alert prioritization, inaudible signals, and failure to distinguish alarm types.',
    cognitive_workflow: '\n\nFOCUS: Concentrate specifically on cognitive and workflow hazards — information overload, too many steps, confusing sequences, poor mental model mapping, and decision-making under time pressure.',
    training_knowledge: '\n\nFOCUS: Concentrate specifically on training and knowledge gap hazards — insufficient user training, knowledge-based mistakes, skill decay over time, and reliance on recall vs. recognition.',
    environmental: '\n\nFOCUS: Concentrate specifically on environmental factor hazards — poor lighting, high noise levels, stress/fatigue, use with gloves, sterile field constraints, and vibration/motion.',
    labels_markings: '\n\nFOCUS: Concentrate specifically on labeling and marking hazards — misread labels, unclear instructions, poor symbology, small print, ambiguous units, and confusing color coding.',
  };
  return (category && map[category]) || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productData, existingHazardDescriptions, uiCharacteristics, focusCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!productData) {
      return new Response(JSON.stringify({ success: false, error: "No product data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingList = (existingHazardDescriptions || []).length > 0
      ? `\n\nIMPORTANT: Do NOT suggest hazards similar to these existing ones:\n${existingHazardDescriptions.map((d: string) => `- ${d}`).join('\n')}`
      : '';

    const uiFeaturesList = Array.isArray(uiCharacteristics) && uiCharacteristics.length > 0
      ? `\n\nDocumented UI Features (from IEC 62366-1 Clause 5.2 analysis):\n${uiCharacteristics.map((c: any) => `- ${c.feature} [Category: ${c.category || 'other'}, Safety: ${c.safety_relevance || 'unknown'}]${c.description ? ': ' + c.description : ''}`).join('\n')}\n\nIMPORTANT: Ground your hazard suggestions in these documented UI features where possible. Each hazard should reference specific UI elements listed above.`
      : '';

    const systemPrompt = `You are a medical device usability engineering expert specializing in IEC 62366-1 and human factors risk analysis per ISO 14971.

Your task is to identify usability-related hazards (use errors, human factors issues, cognitive load problems, user interface design risks) for a medical device.

Focus ONLY on the "human_factors" category. Consider:
- Use errors (slips, mistakes, lapses)
- Perception errors (misreading displays, missing alarms)
- Cognitive overload (too many steps, confusing workflows)
- Physical interaction issues (hard-to-reach controls, poor ergonomics)
- Training gaps and knowledge-based errors
- Environmental factors affecting usability (lighting, noise, stress)
- User interface design deficiencies

Product context:
- Product Name: ${productData.product_name || 'Medical device'}
- Clinical Purpose: ${productData.clinical_purpose || 'Not specified'}
- Indications for Use: ${productData.indications_for_use || 'Not specified'}
- Target Population: ${productData.target_population || 'Not specified'}
- Use Environment: ${productData.use_environment || 'Not specified'}
- Duration of Use: ${productData.duration_of_use || 'Not specified'}
- Device Class: ${productData.device_class || 'Not specified'}
${uiFeaturesList}${existingList}${getFocusCategoryInstruction(focusCategory)}`;

    const userPrompt = `Generate 8-12 usability-related hazards for this medical device. Each hazard must be specific, actionable, and traceable to IEC 62366-1 use scenarios.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_usability_hazards",
              description: "Return usability-related hazard suggestions for a medical device",
              parameters: {
                type: "object",
                properties: {
                  hazards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string", description: "Brief hazard source identification" },
                        hazardous_situation: { type: "string", description: "Root cause - circumstance where user is exposed to hazard" },
                        potential_harm: { type: "string", description: "Specific injury or damage that could result" },
                        foreseeable_sequence_events: { type: "string", description: "Chain of events from use error to harm" },
                        rationale: { type: "string", description: "Why this hazard is relevant per IEC 62366-1" },
                        confidence: { type: "number", description: "Confidence score 0.7-1.0" },
                        category: { type: "string", enum: ["human_factors"], description: "Always human_factors" },
                      },
                      required: ["description", "hazardous_situation", "potential_harm", "foreseeable_sequence_events", "rationale", "confidence", "category"],
                    },
                  },
                },
                required: ["hazards"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_usability_hazards" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim().length === 0) {
      throw new Error("AI gateway returned empty response. Please try again.");
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText.substring(0, 500));
      throw new Error("AI gateway returned invalid response. Please try again.");
    }

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    let result;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments?.substring(0, 500));
      throw new Error("AI returned malformed hazard data. Please try again.");
    }

    return new Response(JSON.stringify({ success: true, suggestions: result.hazards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-usability-hazard-generator error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Failed to generate hazard suggestions" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
