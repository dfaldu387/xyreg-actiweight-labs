import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { extractedText, studyType } = await req.json();
    if (!extractedText) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a medical device usability engineering expert specializing in IEC 62366-1.
You will receive extracted text from a usability evaluation plan or report document.
Parse it into structured JSON fields for a usability study record.

IMPORTANT: Extract ALL available information from the document. Even partial data is valuable.
Do not skip fields just because data is incomplete - include whatever you can find.

Field guidelines:
- name: The study/evaluation name or title. Look for document headers, titles, or "Evaluation Plan" references.
- study_subtype: One of: heuristic_evaluation, cognitive_walkthrough, expert_review, early_prototype_test, functional_prototype_test, think_aloud, contextual_inquiry, simulated_use, clinical_use, comparative_usability, knowledge_task_analysis, use_error_validation, labeling_comprehension, other
- study_dates: Date range or specific dates mentioned anywhere in the document
- conductors: Names and roles of people conducting the study. Look for "conducted by", "evaluators", "moderators", "test administrators"
- objective: Study objective or purpose. Look for "objective", "purpose", "aim", "goal" sections
- method: Overall methodology description. Look for "method", "methodology", "approach", "procedure" sections
- test_location: Physical location/venue. Look for "location", "site", "facility", "lab"
- test_conditions: Environmental or setup conditions. Look for "conditions", "setup", "environment", "configuration"
- prototype_id: Device/prototype identifier. Look for device name, model number, prototype version
- software_version: Software version being tested. Look for "version", "release", "build", "SW"
- ui_under_evaluation: Which UI components are being evaluated. Look for screen names, features, workflows mentioned
- training_description: What training was given to participants. Look for "training", "instruction", "orientation"
- training_to_test_interval: Time between training and test. Look for "interval", "gap", "time between"
- methods_used: Array of evaluation methods. Look for observation, think-aloud, video recording, questionnaire, interview, SUS, etc.
- accompanying_docs: Referenced accompanying documents like IFU, quick reference guides, training materials
- interview_questions: Post-test interview or questionnaire content
- other_equipment: Equipment used during testing (cameras, eye trackers, screen recording)
- acceptance_criteria: Study acceptance criteria or success criteria
- participants_structured: Array of participant objects. Look for participant tables, demographics, user groups, sample sizes.
  Each entry: {id: <generate-uuid>, participant_id: "P1", user_group: "healthcare_professional"|"patient"|"caregiver"|"technician"|"other", demographics: "description"}
  If only group descriptions are given without individual participants, create one entry per group.
- tasks_structured: Array of task objects. Look for task lists, scenarios, use cases, test scripts.
  Each entry: {id: <generate-uuid>, task_id: "T1", description: "...", instruction: "...", acceptance_criteria: "...", ui_area: "..."}
  Even if only task descriptions are available without full details, include them.
- observations: Array of observation objects (usually in reports, not plans)
- positive_learnings: Positive findings/observations summary
- negative_learnings: Negative findings/issues summary  
- recommendations: Recommended actions or improvements
- overall_conclusion: Final study conclusion

For participant IDs and task IDs, generate UUIDs for the "id" field.
Include ALL fields where you find ANY relevant content. Partial data is acceptable.`;

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
          {
            role: "user",
            content: `Parse this ${studyType || "formative"} usability evaluation document into structured fields. Extract as many fields as possible:\n\n${extractedText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_parsed_study",
              description: "Return parsed usability study data extracted from the document. Include all fields where data was found.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  study_subtype: { type: "string" },
                  study_dates: { type: "string" },
                  conductors: { type: "string" },
                  objective: { type: "string" },
                  method: { type: "string" },
                  test_location: { type: "string" },
                  test_conditions: { type: "string" },
                  prototype_id: { type: "string" },
                  software_version: { type: "string" },
                  ui_under_evaluation: { type: "string" },
                  training_description: { type: "string" },
                  training_to_test_interval: { type: "string" },
                  methods_used: { type: "array", items: { type: "string" } },
                  accompanying_docs: { type: "string" },
                  interview_questions: { type: "string" },
                  other_equipment: { type: "string" },
                  acceptance_criteria: { type: "string" },
                  participants_structured: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        participant_id: { type: "string" },
                        user_group: { type: "string" },
                        demographics: { type: "string" },
                      },
                    },
                  },
                  tasks_structured: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        task_id: { type: "string" },
                        description: { type: "string" },
                        instruction: { type: "string" },
                        acceptance_criteria: { type: "string" },
                        ui_area: { type: "string" },
                      },
                    },
                  },
                  observations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_id: { type: "string" },
                        participant_id: { type: "string" },
                        observation: { type: "string" },
                        outcome: { type: "string", enum: ["success", "partial_success", "fail"] },
                        severity: { type: "string", enum: ["low", "mid", "high", "critical"] },
                        use_errors: { type: "string" },
                        hazards_encountered: { type: "string" },
                      },
                    },
                  },
                  positive_learnings: { type: "string" },
                  negative_learnings: { type: "string" },
                  recommendations: { type: "string" },
                  overall_conclusion: { type: "string" },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_parsed_study" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Count extracted fields for diagnostics
    const fieldCount = Object.entries(parsed).filter(([_, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }).length;

    console.log(`Parsed ${fieldCount} fields from document`);

    return new Response(JSON.stringify({ parsed, fieldCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-usability-evaluation-importer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
