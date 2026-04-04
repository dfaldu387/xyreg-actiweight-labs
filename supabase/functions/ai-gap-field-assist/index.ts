import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productId, fieldLabel, fieldType, section, requirementText, currentValue } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch product context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product } = await supabase
      .from("products")
      .select("name, description, intended_purpose_data, key_technology_characteristics, device_class")
      .eq("id", productId)
      .single();

    const productContext = product
      ? `Product: ${product.name}\nDescription: ${product.description || 'N/A'}\nDevice Class: ${product.device_class || 'N/A'}\nIntended Purpose: ${JSON.stringify(product.intended_purpose_data || {})}\nTechnical Characteristics: ${JSON.stringify(product.key_technology_characteristics || {})}`
      : "No product data available.";

    const systemPrompt = `You are a medical device regulatory expert specializing in IEC 60601-1 compliance.
Given the product context and the specific IEC 60601-1 requirement, provide a concise, accurate suggestion for the field.
Return ONLY the suggested value — no explanations, no markdown, no quotes. Keep it brief and directly applicable.
For select fields, return exactly one of the valid option values.
For text/textarea fields, provide a concise technical answer appropriate for regulatory documentation.`;

    const userPrompt = `${productContext}

IEC 60601-1 Section: ${section}
Requirement: ${requirementText || 'N/A'}
Field: ${fieldLabel}
Field Type: ${fieldType}
Current Value: ${currentValue || '(empty)'}

Provide the suggested value for this field:`;

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
        max_tokens: 300,
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
    const suggestion = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-gap-field-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
