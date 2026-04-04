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
    const { companyId, productData, hazards, uiCharacteristics, intendedUsers, useEnvironments } = await req.json();
    console.log('[ai-evaluation-plan-generator] Request received:', { companyId, productName: productData?.product_name, hazardCount: hazards?.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a medical device usability engineering expert with deep knowledge of IEC 62366-1, ISO 14971, and FDA Human Factors guidance.

Given a medical device's usability context (hazards, UI characteristics, intended users, use environments), generate concrete formative and summative usability study suggestions by calling the generate_evaluation_plan function.

For formative_studies, generate 2-4 distinct studies. Choose appropriate study_type values from: heuristic_evaluation, cognitive_walkthrough, expert_review, early_prototype_test, functional_prototype_test, think_aloud, contextual_inquiry.

For summative_studies, generate 1-2 distinct studies. Choose appropriate study_type values from: simulated_use, clinical_use, comparative_usability, knowledge_task_analysis, use_error_validation, labeling_comprehension.

Each study must be specific to the device and reference actual hazards and UI characteristics. Do NOT generate generic boilerplate. Tie objectives, tasks, and acceptance criteria to the specific hazards provided.`;

    // Build hazard summary
    const hazardSummary = (hazards || []).map((h: any) =>
      `${h.hazard_id}: ${h.description || 'No description'} | Situation: ${h.hazardous_situation || 'N/A'} | Harm: ${h.potential_harm || 'N/A'} | Severity: ${h.initial_severity || 'N/A'} | Risk Controls: ${h.risk_control_measure || 'None'}`
    ).join('\n');

    const uiSummary = (uiCharacteristics || []).map((c: any) =>
      `${c.feature} (${c.safety_relevance} safety relevance): ${c.description || ''}`
    ).join('\n');

    const userSummary = (intendedUsers || []).map((u: any) =>
      `Profile: ${u.profile} | Characteristics: ${u.characteristics || 'N/A'} | Training: ${u.training_level || 'N/A'}`
    ).join('\n');

    const envSummary = (useEnvironments || []).map((e: any) =>
      `${e.environment}: ${e.conditions || 'N/A'}`
    ).join('\n');

    const userPrompt = `Generate formative and summative usability study suggestions for:

Product: ${productData?.product_name || 'Unknown'}
Device Class: ${productData?.device_class || 'Not specified'}
Intended Use: ${productData?.intended_purpose || 'Not specified'}

USABILITY HAZARDS (${hazards?.length || 0}):
${hazardSummary || 'None identified yet'}

UI CHARACTERISTICS:
${uiSummary || 'None documented yet'}

INTENDED USERS:
${userSummary || 'Not specified'}

USE ENVIRONMENTS:
${envSummary || 'Not specified'}`;

    console.log('[ai-evaluation-plan-generator] Calling Lovable AI Gateway...');

    const studySchema = {
      type: "object",
      properties: {
        name: { type: "string", description: "Descriptive study name, e.g. 'Heuristic Evaluation of Alarm Interface'" },
        study_type: { type: "string", description: "Must match one of the allowed enum values" },
        objective: { type: "string", description: "What this study aims to evaluate, referencing specific hazards" },
        method: { type: "string", description: "How the study will be conducted (protocol summary)" },
        participants: { type: "string", description: "Who participates — number, profile, recruitment criteria" },
        tasks: { type: "string", description: "Critical tasks to evaluate, tied to hazard scenarios" },
        acceptance_criteria: { type: "string", description: "Measurable pass/fail criteria" },
      },
      required: ["name", "study_type", "objective", "method", "participants", "tasks", "acceptance_criteria"],
    };

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
              name: "generate_evaluation_plan",
              description: "Generate structured formative and summative usability study suggestions",
              parameters: {
                type: "object",
                properties: {
                  formative_studies: {
                    type: "array",
                    description: "2-4 formative study suggestions",
                    items: studySchema,
                  },
                  summative_studies: {
                    type: "array",
                    description: "1-2 summative study suggestions",
                    items: studySchema,
                  },
                },
                required: ["formative_studies", "summative_studies"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_evaluation_plan" } },
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
      console.error('[ai-evaluation-plan-generator] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[ai-evaluation-plan-generator] Failed to parse response:', responseText.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }

    console.log('[ai-evaluation-plan-generator] Response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('[ai-evaluation-plan-generator] No tool call in response');
      throw new Error('AI did not return structured output');
    }

    const plan = JSON.parse(toolCall.function.arguments);
    console.log('[ai-evaluation-plan-generator] Studies generated:', {
      formative: plan.formative_studies?.length,
      summative: plan.summative_studies?.length,
    });

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-evaluation-plan-generator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
