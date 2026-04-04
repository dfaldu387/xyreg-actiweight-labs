import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FieldDef {
  id: string;
  label: string;
  type: string;
  options?: string[];
  currentValue?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productId, stepId, stepLabel, requirementText, fields, frameworkId } = await req.json() as {
      productId: string;
      stepId: string;
      stepLabel: string;
      requirementText: string;
      fields: FieldDef[];
      frameworkId?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product } = await supabase
      .from("products")
      .select("name, description, intended_purpose_data, key_technology_characteristics, class")
      .eq("id", productId)
      .single();

    if (!product) throw new Error("Product not found");

    const productContext = `Product: ${product.name}
Description: ${product.description || "N/A"}
Device Class: ${product.class || "N/A"}
Intended Purpose: ${JSON.stringify(product.intended_purpose_data || {})}
Technical Characteristics: ${JSON.stringify(product.key_technology_characteristics || {})}`;

    const fieldsDescription = fields.map(f => {
      let desc = `- Field ID: "${f.id}", Label: "${f.label}", Type: ${f.type}`;
      if (f.options && f.options.length > 0) {
        desc += `, Valid options: [${f.options.map(o => `"${o}"`).join(", ")}]`;
      }
      if (f.currentValue) {
        desc += `, Current value: "${f.currentValue}"`;
      }
      return desc;
    }).join("\n");

    const standardName = frameworkId || 'medical device standards';
    const systemPrompt = `You are a medical device regulatory expert specializing in ${standardName} compliance.
Given product information and a gap analysis step, suggest values for each form field.

Rules:
- For "select" type fields, you MUST return one of the valid options exactly as listed.
- For "text" type fields, provide a concise, professional regulatory response.
- For "textarea" and "richtext" type fields that ask for a LIST of items (e.g. normative references, standards, documents, hazards, risk controls), return the items as an HTML unordered list: <ul><li>Item 1</li><li>Item 2</li></ul>. Each item should be on its own bullet point.
- For other "textarea" and "richtext" type fields, provide a detailed response with proper formatting. Use <p> tags for paragraphs.
- For fields labeled with "Notes" related to hazards, describe the relevant hazards, their sources, and mitigation considerations specific to the product.
- For document reference fields, suggest specific document section references relevant to ${standardName} (e.g., "Section 4.2 of Risk Management File" or "${standardName} Clause 8.7").
- If a field already has a value, only suggest a different value if there's a clear improvement.
- Each suggestion must include a brief rationale (1-2 sentences).
- Be specific to the product's characteristics and intended use.`;

    const userPrompt = `${productContext}

Gap Analysis Step: ${stepLabel} (${stepId})
Requirement: ${requirementText}

Fields to assess:
${fieldsDescription}

Provide a suggested value and rationale for each field.`;

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
              name: "suggest_field_values",
              description: "Return suggested values for gap analysis form fields",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fieldId: { type: "string", description: "The field ID" },
                        suggestedValue: { type: "string", description: "The suggested value for the field" },
                        rationale: { type: "string", description: "1-2 sentence rationale for the suggestion" },
                      },
                      required: ["fieldId", "suggestedValue", "rationale"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_field_values" } },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Enrich with field labels
    const enriched = (parsed.suggestions || []).map((s: any) => {
      const fieldDef = fields.find(f => f.id === s.fieldId);
      return {
        ...s,
        fieldLabel: fieldDef?.label || s.fieldId,
        fieldType: fieldDef?.type || "text",
        currentValue: fieldDef?.currentValue || "",
      };
    });

    return new Response(JSON.stringify({ suggestions: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-gap-step-assess error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
