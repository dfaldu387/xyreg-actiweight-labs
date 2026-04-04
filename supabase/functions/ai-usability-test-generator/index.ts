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
    const { hazards, productContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!hazards || hazards.length === 0) {
      return new Response(JSON.stringify({ error: "No hazards provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a medical device usability engineering expert specializing in IEC 62366-1.
Given a list of usability hazards (HAZ-USE), generate validation test cases that verify the risk controls are effective.

For each hazard, produce one test case. Consider:
- The severity and risk level to decide formative vs summative
- The hazardous situation and root cause to design realistic test steps
- The risk control measure to define acceptance criteria

Product context: ${productContext || 'Medical device under development'}`;

    const hazardSummary = hazards.map((h: any) =>
      `- ${h.hazard_id}: "${h.description}" | Root cause: ${h.hazardous_situation || 'N/A'} | Harm: ${h.potential_harm || 'N/A'} | Risk control: ${h.risk_control_measure || 'N/A'} | Initial risk: ${h.initial_risk || 'N/A'} | Severity: ${h.severity || 'N/A'}`
    ).join('\n');

    const userPrompt = `Generate validation test cases for these usability hazards:\n\n${hazardSummary}`;

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
              name: "suggest_test_cases",
              description: "Return validation test cases for usability hazards",
              parameters: {
                type: "object",
                properties: {
                  test_cases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        hazard_id: { type: "string", description: "The source HAZ-USE ID" },
                        name: { type: "string", description: "Test case name, e.g. 'Validate safe use - HAZ-USE-007'" },
                        description: { type: "string", description: "Purpose of the test tied to the hazard" },
                        test_level: { type: "string", enum: ["formative", "summative"], description: "Based on risk severity" },
                        category: { type: "string", enum: ["use_error_analysis", "hazard_related_use_scenario", "simulated_use", "cognitive_walkthrough", "heuristic_evaluation", "user_testing"], description: "IEC 62366-1 category" },
                        test_steps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              step: { type: "string" },
                              expected: { type: "string" },
                            },
                            required: ["step", "expected"],
                          },
                        },
                        acceptance_criteria: { type: "string", description: "Measurable criteria for harm prevention" },
                        priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      },
                      required: ["hazard_id", "name", "description", "test_level", "category", "test_steps", "acceptance_criteria", "priority"],
                    },
                  },
                },
                required: ["test_cases"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_test_cases" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify({ success: true, suggestions: result.test_cases }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-usability-test-generator error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate test cases" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
