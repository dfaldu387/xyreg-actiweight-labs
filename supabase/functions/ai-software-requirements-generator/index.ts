/**
 * AI Software Requirements Generator Edge Function
 *
 * Uses Google Vertex AI (Gemini) to generate software requirements from system requirements.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { trackTokenUsage, extractGeminiDetailedUsage, logAiTokenUsage, checkAiCredits } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

interface SystemRequirement { requirement_id: string; description: string; }
interface ServiceAccount { type: string; project_id: string; private_key_id: string; private_key: string; client_email: string; client_id: string; auth_uri: string; token_uri: string; client_x509_cert_url: string; }

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
const MODEL = "gemini-2.5-flash";

function normalizeToJson(input: string): string { let s = input.trim(); if (s.startsWith('"') && s.endsWith('"')) { try { s = JSON.parse(s); } catch { /* */ } } if (typeof s !== "string") return s; s = s.trim().replace(/;+\s*$/, ""); s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":'); s = s.replace(/,(\s*[}\]])/g, "$1"); return s; }
function tryParseServiceAccount(key: string): ServiceAccount | null { try { const n = normalizeToJson(key); const p = typeof n === "string" ? JSON.parse(n) : n; if (p?.type === "service_account" && p.private_key && p.client_email && p.project_id) return p as ServiceAccount; return null; } catch { return null; } }
async function getAccessTokenFromServiceAccount(sa: ServiceAccount): Promise<string> { const pk = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\n/g,"").trim(); const kb = Uint8Array.from(atob(pk),(c)=>c.charCodeAt(0)); const ck = await crypto.subtle.importKey("pkcs8",kb,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]); const now = getNumericDate(new Date()); const jwt = await create({alg:"RS256",typ:"JWT"},{iss:sa.client_email,sub:sa.client_email,aud:sa.token_uri,iat:now,exp:now+3600,scope:"https://www.googleapis.com/auth/cloud-platform"},ck); const tr = await fetch(sa.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})}); if(!tr.ok){const t=await tr.text();throw new Error(`Token exchange failed: ${tr.status} - ${t}`);} const td=await tr.json(); if(!td.access_token)throw new Error("No access token"); return td.access_token; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, productData, systemRequirements, selectedCategories, existingItems, additionalPrompt, outputLanguage } = await req.json();
    console.log("[ai-software-requirements-generator] Starting generation");

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

    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader) { const token = authHeader.replace("Bearer ", ""); const { data: { user } } = await supabase.auth.getUser(token); userId = user?.id; }

    let decryptedKey = "";
    if (companyId) { const { data: kr } = await supabase.from("company_api_keys").select("encrypted_key").eq("company_id", companyId).eq("key_type", "google_vertex").maybeSingle(); if (kr?.encrypted_key) decryptedKey = kr.encrypted_key; }
    if (!decryptedKey) { const ek = Deno.env.get("GOOGLE_VERTEX_API_KEY") || ""; if (ek) decryptedKey = ek; }
    if (!decryptedKey) return new Response(JSON.stringify({ success: false, error: "No Google Vertex AI credential configured." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    decryptedKey = decryptedKey.trim();
    const sa = tryParseServiceAccount(decryptedKey);
    if (!sa) return new Response(JSON.stringify({ success: false, error: "Credential must be a service-account JSON." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${sa.project_id}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;

    const existingItemsSection = existingItems?.length > 0
      ? `\n\nEXISTING SOFTWARE REQUIREMENTS (DO NOT suggest again):\n${existingItems.map((i: string) => `- "${i}"`).join("\n")}\n\nGenerate ONLY NEW requirements.`
      : "";

    const systemPrompt = `You are a Software Lead for medical device development. Translate system requirements into specific, actionable software requirements.${existingItemsSection}

CONTEXT:
- Device: ${productData.product_name || "Medical Device"}
- Clinical Purpose: ${productData.clinical_purpose || "Not specified"}
- Target Population: ${productData.target_population || "Not specified"}
- Use Environment: ${productData.use_environment || "Not specified"}
- Device Class: ${productData.device_class || "Not specified"}

SYSTEM REQUIREMENTS TO IMPLEMENT:
${(systemRequirements || []).map((sr: SystemRequirement) => `${sr.requirement_id}: ${sr.description}`).join("\n")}

SOFTWARE LEAD PRINCIPLES:
1. Break down system requirements into implementable software functionality
2. Each software requirement MUST trace back to specific system requirements
3. Focus on software behavior, interfaces, and performance
4. Include IEC 62304 software safety classifications where relevant
5. Consider software architecture patterns for medical devices
6. Address cybersecurity requirements
7. Include software verification and validation requirements

CATEGORIES: ${selectedCategories?.length > 0 ? selectedCategories.join(", ") : "Functional, Interface, Performance, Security, Safety, Usability"}

Generate 5-8 software requirements. Return ONLY a JSON array:
[
  {
    "description": "The software shall...",
    "category": "Functional|Interface|Performance|Security|Safety|Usability",
    "rationale": "This implements system requirement SR-XXX by...",
    "traces_to": "SR-001, SR-003",
    "linked_risks": "Software failure modes or cybersecurity concerns",
    "acceptance_criteria": "Specific software testing criteria",
    "confidence": 0.85
  }
]${outputLanguage && outputLanguage !== "en" ? `\n\nGenerate ALL text in ${outputLanguage === "de" ? "German" : outputLanguage === "fr" ? "French" : outputLanguage === "fi" ? "Finnish" : outputLanguage}. Keep JSON keys in English.` : ""}${additionalPrompt ? `\n\nAdditional instructions:\n${additionalPrompt}` : ""}`;

    // --- Call Vertex AI with retry on parse failure ---
    const requestBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Generate software requirements that implement these system requirements following IEC 62304 and FDA cybersecurity guidance." }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
    });

    let suggestions: any[] | null = null;
    let vertexData: any = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const vertexResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
        body: requestBody,
      });

      if (!vertexResponse.ok) {
        const errorText = await vertexResponse.text();
        console.error("[ai-software-requirements-generator] Vertex error:", vertexResponse.status, errorText);
        if (vertexResponse.status === 429) return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded.", errorType: "rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ success: false, error: `AI service error (${vertexResponse.status})` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      vertexData = await vertexResponse.json();
      const parts = vertexData?.candidates?.[0]?.content?.parts || [];
      const allText = parts.map((p: any) => p.text ?? "").join("\n");
      const nonThoughtText = parts.filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("\n");
      const aiResponse = (nonThoughtText.trim() || allText.trim());
      console.log(`[ai-software-requirements-generator] Attempt ${attempt + 1}: parts=${parts.length}, responseLen=${aiResponse.length}`);

      if (!aiResponse) { if (attempt === 0) { console.log("[ai-software-requirements-generator] Empty response, retrying..."); continue; } return new Response(JSON.stringify({ success: false, error: "No content generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      // Try parsing
      try {
        try { const d = JSON.parse(aiResponse); suggestions = Array.isArray(d) ? d : (d.suggestions || d.data || []); }
        catch {
          const cbm = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (cbm) { suggestions = JSON.parse(cbm[1]); }
          else { const jm = aiResponse.match(/\[[\s\S]*\]/); if (jm) suggestions = JSON.parse(jm[0]); else throw new Error("No JSON array"); }
        }
        if (!Array.isArray(suggestions)) throw new Error("Not an array");
        break; // Success — exit retry loop
      } catch (e) {
        console.error(`[ai-software-requirements-generator] Parse attempt ${attempt + 1} failed:`, e);
        if (attempt === 0) { console.log("[ai-software-requirements-generator] Retrying..."); suggestions = null; continue; }
        console.error("[ai-software-requirements-generator] Full response:", aiResponse);
        return new Response(JSON.stringify({ success: false, error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (!suggestions || suggestions.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No suggestions generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Track token usage
    if (companyId && vertexData) {
      const detailedUsage = extractGeminiDetailedUsage(vertexData);
      if (detailedUsage) {
        EdgeRuntime.waitUntil(Promise.all([
          logAiTokenUsage({ companyId, userId, source: "ai_software_requirements", model: MODEL, usage: detailedUsage, metadata: { productName: productData.product_name ?? null } }),
          trackTokenUsage(companyId, "google_vertex", { promptTokens: detailedUsage.inputTokens, completionTokens: detailedUsage.outputTokens, totalTokens: detailedUsage.totalTokens }),
        ]));
      }
    }

    console.log("[ai-software-requirements-generator] Generated", suggestions.length, "suggestions");

    return new Response(JSON.stringify({
      success: true, suggestions,
      metadata: { generatedAt: new Date().toISOString(), productName: productData.product_name, totalSuggestions: suggestions.length, categoriesGenerated: [...new Set(suggestions.map((s: any) => s.category))] },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[ai-software-requirements-generator] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error", errorType: "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
