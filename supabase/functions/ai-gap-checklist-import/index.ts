import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { extractedText, clauseFields } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!extractedText || !clauseFields?.length) {
      throw new Error("Missing extractedText or clauseFields");
    }

    // Build a compact description of all fields for the AI
    const fieldDescriptions = clauseFields.map((cf: any) =>
      `Section ${cf.section} | Step "${cf.stepLabel}" | Field ID: ${cf.fieldId} | Label: "${cf.fieldLabel}" | Type: ${cf.fieldType}${cf.options ? ` | Options: [${cf.options}]` : ''}`
    ).join('\n');

    const systemPrompt = `You are a medical device regulatory expert. You will receive:
1. Extracted text from a filled IEC 60601-1 compliance checklist document
2. A list of form fields with their IDs, labels, types, and available options

Your task: Map the document content to the form fields. For each field where you find relevant information in the document, extract the appropriate value.

Rules:
- For "select" fields, return EXACTLY one of the listed option values
- For "text" and "textarea" fields, return concise extracted text
- Only return fields where you found clear evidence in the document
- Include a confidence score (0-1) for each mapping
- Be precise — do not guess or fabricate data`;

    const userPrompt = `## Document Content (extracted from uploaded checklist):
${extractedText.substring(0, 15000)}

## Form Fields to Map:
${fieldDescriptions}

Extract and map the document content to the form fields above.`;

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
              name: "map_checklist_fields",
              description: "Map extracted document content to IEC 60601-1 form fields",
              parameters: {
                type: "object",
                properties: {
                  mappings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string", description: "The clause section number e.g. '1.1'" },
                        fieldId: { type: "string", description: "The exact field ID from the form definition" },
                        suggestedValue: { type: "string", description: "The extracted/mapped value for this field" },
                        confidence: { type: "number", description: "Confidence score 0-1" },
                      },
                      required: ["section", "fieldId", "suggestedValue", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["mappings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "map_checklist_fields" } },
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    let mappings: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        mappings = parsed.mappings || [];
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    return new Response(JSON.stringify({ mappings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-gap-checklist-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
