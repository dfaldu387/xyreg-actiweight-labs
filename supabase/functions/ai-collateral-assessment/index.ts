import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COLLATERAL_STANDARDS = [
  { id: "1-2", name: "IEC 60601-1-2", topic: "Electromagnetic compatibility (EMC)", fieldId: "collateral_60601_1_2" },
  { id: "1-3", name: "IEC 60601-1-3", topic: "Radiation protection in diagnostic X-ray equipment", fieldId: "collateral_60601_1_3" },
  { id: "1-6", name: "IEC 60601-1-6", topic: "Usability", fieldId: "collateral_60601_1_6" },
  { id: "1-8", name: "IEC 60601-1-8", topic: "Alarm systems", fieldId: "collateral_60601_1_8" },
  { id: "1-9", name: "IEC 60601-1-9", topic: "Environmentally conscious design", fieldId: "collateral_60601_1_9" },
  { id: "1-10", name: "IEC 60601-1-10", topic: "Physiologic closed-loop controllers", fieldId: "collateral_60601_1_10" },
  { id: "1-11", name: "IEC 60601-1-11", topic: "Home healthcare environment", fieldId: "collateral_60601_1_11" },
  { id: "1-12", name: "IEC 60601-1-12", topic: "Emergency medical services environment", fieldId: "collateral_60601_1_12" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productId } = await req.json();

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
Description: ${product.description || 'N/A'}
Device Class: ${product.class || 'N/A'}
Intended Purpose: ${JSON.stringify(product.intended_purpose_data || {})}
Technical Characteristics: ${JSON.stringify(product.key_technology_characteristics || {})}`;

    const standardsList = COLLATERAL_STANDARDS.map(s => `- ${s.name}: ${s.topic}`).join("\n");

    const systemPrompt = `You are a medical device regulatory expert specializing in IEC 60601-1 compliance.
Given the product information, assess which IEC 60601-1 collateral standards apply.
For EACH standard, determine "Yes", "No", or "N/A" and provide a concise justification (1-2 sentences) based on the product characteristics.

Key decision criteria:
- IEC 60601-1-2 (EMC): Applies to virtually ALL ME equipment
- IEC 60601-1-3 (Radiation): Only if device emits or uses diagnostic X-ray radiation
- IEC 60601-1-6 (Usability): If device has any user interface (display, controls, touchscreen)
- IEC 60601-1-8 (Alarms): If device generates any audible/visual alarms or warnings
- IEC 60601-1-9 (Environment): Addresses environmentally conscious design; broadly applicable
- IEC 60601-1-10 (Closed-loop): Only if device has physiologic feedback control loop
- IEC 60601-1-11 (Home): Only if device is intended for home/non-clinical environment
- IEC 60601-1-12 (EMS): Only if device is intended for emergency medical services`;

    const userPrompt = `${productContext}

Assess applicability of each collateral standard:
${standardsList}`;

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
              name: "assess_collateral_standards",
              description: "Return applicability assessment for each IEC 60601-1 collateral standard",
              parameters: {
                type: "object",
                properties: {
                  assessments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        standardId: { type: "string", description: "e.g. 1-2, 1-3, 1-6" },
                        applicable: { type: "string", enum: ["Yes", "No", "N/A"] },
                        justification: { type: "string", description: "1-2 sentence rationale" },
                      },
                      required: ["standardId", "applicable", "justification"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["assessments"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assess_collateral_standards" } },
        temperature: 0.3,
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
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    
    // Enrich with display info
    const enriched = parsed.assessments.map((a: any) => {
      const std = COLLATERAL_STANDARDS.find(s => s.id === a.standardId);
      return {
        ...a,
        name: std?.name || `IEC 60601-${a.standardId}`,
        topic: std?.topic || "",
        fieldId: std?.fieldId || "",
      };
    });

    return new Response(JSON.stringify({ assessments: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-collateral-assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
