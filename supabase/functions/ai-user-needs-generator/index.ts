/**
 * AI User Needs Generator Edge Function
 *
 * Uses Google Vertex AI (Gemini) to generate user needs for medical devices.
 *
 * Request body: { companyId, productData, categories?, additionalPrompt?, outputLanguage?, existingItems? }
 * Response:     { suggestions, metadata }
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { trackTokenUsage, extractGeminiDetailedUsage, logAiTokenUsage, checkAiCredits } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "gemini-2.5-flash";
const ENCRYPTION_KEY = "medtech-api-key-2024";

function decryptApiKey(encryptedKey: string): string {
  if (encryptedKey.startsWith("AIza")) return encryptedKey;
  try {
    const base64Decoded = atob(encryptedKey);
    return Array.from(base64Decoded)
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join("");
  } catch {
    return encryptedKey;
  }
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[ai-user-needs-generator] Starting user needs generation");

    const requestBody = await req.json();
    const { companyId, productData, additionalPrompt, outputLanguage, existingItems } = requestBody;

    if (!companyId || !productData) {
      return new Response(JSON.stringify({ error: "Missing required parameters: companyId and productData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check AI credits before processing
    if (companyId) {
      const creditCheck = await checkAiCredits(companyId);
      if (!creditCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "NO_CREDITS",
            message: "No AI credits remaining. Purchase an AI Booster Pack to continue.",
            used: creditCheck.used,
            limit: creditCheck.limit,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from auth header
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // --- Resolve Google Vertex AI credential ---
    // --- Resolve Gemini API key ---
    let geminiApiKey = "";
    const { data: keyRecord } = await supabase
      .from("company_api_keys")
      .select("encrypted_key")
      .eq("company_id", companyId)
      .eq("key_type", "gemini")
      .maybeSingle();
    if (keyRecord?.encrypted_key) {
      geminiApiKey = decryptApiKey(keyRecord.encrypted_key);
    }
    if (!geminiApiKey) {
      geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
    }
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "No Gemini API key configured. Add one in Settings > API Keys." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`;
    console.log("[ai-user-needs-generator] Using Gemini direct API");

    // Strip HTML tags from input text
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

    // Extract product information
    const clinicalPurpose = stripHtml(productData.clinical_purpose || productData.intended_purpose_data?.clinicalPurpose || "");
    const indicationsForUse = stripHtml(productData.indications_for_use || productData.intended_purpose_data?.indicationsForUse || "");
    const targetPopulation = stripHtml(productData.target_population || productData.intended_purpose_data?.targetPopulation || "");
    const useEnvironment = stripHtml(productData.use_environment || productData.intended_purpose_data?.useEnvironment || "");
    const durationOfUse = stripHtml(productData.duration_of_use || productData.intended_purpose_data?.durationOfUse || "");

    // Extract target markets
    const markets = (productData.markets || []).filter((m: any) => m.selected !== false);
    const marketNames = markets.map((m: any) => m.name || m.market_code || m.code).filter(Boolean).join(", ");

    const marketContext = marketNames
      ? `\n\nTarget Markets: ${marketNames}\n\nIMPORTANT: Since this device will be marketed in ${marketNames}, include market-specific user needs related to:\n- Regulatory compliance\n- Labeling requirements\n- Packaging requirements\n- Required clinical studies\n- Market-specific safety or performance standards\n- Language and documentation requirements\n- Post-market surveillance requirements\n- Quality system requirements (e.g., ISO 13485, QSR for USA)`
      : "";

    const existingItemsSection = existingItems && existingItems.length > 0
      ? `\n\nEXISTING USER NEEDS (DO NOT suggest these again):\n${existingItems.map((item: string) => `- "${item}"`).join("\n")}\n\nGenerate ONLY NEW user needs that are substantially different from the above.`
      : "";

    const prompt = `You are a medical device expert tasked with identifying user needs for a medical device. Based on the product information provided, generate a comprehensive list of user needs.

Product Information:
- Product Name: ${productData.product_name || "Not specified"}
- Device Class: ${productData.device_class || "Not specified"}
- Clinical Purpose: ${clinicalPurpose}
- Indications for Use: ${indicationsForUse}
- Target Population: ${targetPopulation}
- Use Environment: ${useEnvironment}
- Duration of Use: ${durationOfUse}${marketContext}${existingItemsSection}

Please generate 6-8 user needs that are specific, measurable, and relevant to this medical device. Each user need should:
1. Be written from the user's perspective
2. Be specific and actionable
3. Be relevant to the device's intended use and target markets
4. Consider safety, efficacy, usability, and regulatory requirements
${marketNames ? "5. Include market-specific regulatory and compliance needs" : ""}

For each user need, provide:
- description: A clear, concise statement of the user need (max 2 sentences)
- rationale: Why this need is important (max 2 sentences)
- confidence: A number between 0.7 and 1.0
- category: One of: "Safety", "Efficacy", "Usability", "Training", "Maintenance", "Regulatory", "Performance"

IMPORTANT: Keep descriptions and rationale SHORT. Return ONLY a valid JSON array.${outputLanguage && outputLanguage !== "en" ? `\n\nIMPORTANT: Generate ALL output text in ${outputLanguage === "de" ? "German" : outputLanguage === "fr" ? "French" : outputLanguage === "fi" ? "Finnish" : outputLanguage}. Keep JSON keys in English.` : ""}${additionalPrompt ? `\n\nAdditional instructions:\n${additionalPrompt}` : ""}`;

    // --- Call Gemini API ---
    const vertexResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error("[ai-user-needs-generator] Vertex API error:", vertexResponse.status, errorText);
      return new Response(JSON.stringify({ error: `AI service error (${vertexResponse.status}): ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vertexData = await vertexResponse.json();

    if (!vertexData.candidates?.[0]?.content?.parts?.[0]?.text) {
      return new Response(JSON.stringify({ error: "No content generated by AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = vertexData.candidates[0].content.parts[0].text;

    // --- Track token usage (non-blocking) ---
    if (companyId) {
      const detailedUsage = extractGeminiDetailedUsage(vertexData);
      if (detailedUsage) {
        EdgeRuntime.waitUntil(
          Promise.all([
            logAiTokenUsage({
              companyId,
              userId,
              source: 'ai_user_needs',
              model: MODEL,
              usage: detailedUsage,
              metadata: { productName: productData.product_name ?? null },
            }),
            trackTokenUsage(companyId, 'google_vertex', {
              promptTokens: detailedUsage.inputTokens,
              completionTokens: detailedUsage.outputTokens,
              totalTokens: detailedUsage.totalTokens,
            }),
          ])
        );
      }
    }

    // Sanitize and parse JSON
    const sanitizeJson = (text: string): string => {
      return text
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
        .replace(/```(?:json)?\s*/gi, "").replace(/```/g, "")
        .trim();
    };

    let suggestions: any[];
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        let cleaned = sanitizeJson(aiResponse);
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) cleaned = arrayMatch[0];
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          cleaned = cleaned.replace(/'/g, '"');
          parsed = JSON.parse(cleaned);
        }
      }
      suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.data || []);
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error("Response is not a valid array of suggestions");
      }
    } catch (parseError) {
      console.error("[ai-user-needs-generator] Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[ai-user-needs-generator] Successfully generated", suggestions.length, "suggestions");

    return new Response(JSON.stringify({
      suggestions,
      metadata: { generatedAt: new Date().toISOString(), productName: productData.product_name, totalSuggestions: suggestions.length },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-user-needs-generator] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
