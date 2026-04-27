/**
 * AI V&V Plan Generator Edge Function
 *
 * Uses Google Vertex AI (Gemini) to generate V&V plans for medical devices.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { trackTokenUsage, extractGeminiDetailedUsage, logAiTokenUsage, checkAiCredits } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

interface ServiceAccount { type: string; project_id: string; private_key_id: string; private_key: string; client_email: string; client_id: string; auth_uri: string; token_uri: string; client_x509_cert_url: string; }

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
const MODEL = "gemini-2.5-flash";

function normalizeToJson(input: string): string { let s = input.trim(); if (s.startsWith('"') && s.endsWith('"')) { try { s = JSON.parse(s); } catch { /* */ } } if (typeof s !== "string") return s; s = s.trim().replace(/;+\s*$/, ""); s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":'); s = s.replace(/,(\s*[}\]])/g, "$1"); return s; }
function tryParseServiceAccount(key: string): ServiceAccount | null { try { const n = normalizeToJson(key); const p = typeof n === "string" ? JSON.parse(n) : n; if (p?.type === "service_account" && p.private_key && p.client_email && p.project_id) return p as ServiceAccount; return null; } catch { return null; } }
async function getAccessTokenFromServiceAccount(sa: ServiceAccount): Promise<string> { const pk = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\n/g,"").trim(); const kb = Uint8Array.from(atob(pk),(c)=>c.charCodeAt(0)); const ck = await crypto.subtle.importKey("pkcs8",kb,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]); const now = getNumericDate(new Date()); const jwt = await create({alg:"RS256",typ:"JWT"},{iss:sa.client_email,sub:sa.client_email,aud:sa.token_uri,iat:now,exp:now+3600,scope:"https://www.googleapis.com/auth/cloud-platform"},ck); const tr = await fetch(sa.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})}); if(!tr.ok){const t=await tr.text();throw new Error(`Token exchange failed: ${tr.status} - ${t}`);} const td=await tr.json(); if(!td.access_token)throw new Error("No access token"); return td.access_token; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, productData, scopeType, familyProducts } = await req.json();
    const isFamily = scopeType === "product_family" && familyProducts?.length > 0;
    console.log("[ai-vv-plan-generator] Request:", { companyId, productName: productData?.product_name, scopeType });

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
    if (!decryptedKey) return new Response(JSON.stringify({ success: false, error: "No Google Vertex AI credential configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    decryptedKey = decryptedKey.trim();
    const sa = tryParseServiceAccount(decryptedKey);
    if (!sa) return new Response(JSON.stringify({ success: false, error: "Credential must be a service-account JSON." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${sa.project_id}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;

    let systemPrompt = `You are a medical device V&V planning expert with deep knowledge of IEC 62304, ISO 13485, ISO 14971, and FDA 21 CFR Part 820.

Generate a comprehensive V&V plan. Guidelines:
- Name should be specific to the product
- Description should summarize the V&V strategy
- Scope should cover all applicable V&V activities
- Select appropriate methodologies (inspection, analysis, test, demonstration)
- Select appropriate test levels (unit, integration, system, validation)
- Acceptance criteria should be measurable
- Roles should reflect a typical medtech QMS organization`;

    if (isFamily) {
      systemPrompt += `\n\nThis plan covers an entire product family. You must:
- Name the plan for the product family
- Define scope covering ALL variants
- Address shared verification activities
- Call out variant-specific validation needs
- Use the highest device class for V&V rigor`;
    }

    systemPrompt += `\n\nReturn ONLY a JSON object with this structure:
{
  "name": "V&V Plan - [Product Name]",
  "description": "Brief V&V strategy description",
  "scope": "Scope of V&V activities",
  "methodology": ["inspection", "analysis", "test", "demonstration"],
  "test_levels": ["unit", "integration", "system", "validation"],
  "acceptance_criteria": "Measurable acceptance criteria",
  "roles": [
    { "role": "Role Title", "responsibility": "What they do" }
  ]
}`;

    let userPrompt = `Generate a V&V plan for:
Product Name: ${productData.product_name || "Unknown"}
Device Class: ${productData.device_class || "Not specified"}
Intended Use: ${productData.clinical_purpose || productData.intended_purpose || "Not specified"}
Target Markets: ${productData.markets?.map((m: any) => m.name || m).join(", ") || "Not specified"}
Requirements: ${productData.requirements_count || 0}
Hazards: ${productData.hazards_count || 0}`;

    if (isFamily) {
      const variantList = familyProducts.map((p: any) =>
        `${p.name} (Class: ${p.device_class || "N/A"}, Use: ${p.intended_purpose || "N/A"})`
      ).join("\n- ");
      userPrompt += `\n\nProduct Family Variants (${familyProducts.length}):\n- ${variantList}`;
    }

    // Call Vertex AI with retry
    const requestBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
    });

    let plan: any = null;
    let vertexData: any = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const vertexResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
        body: requestBody,
      });

      if (!vertexResponse.ok) {
        const errorText = await vertexResponse.text();
        if (vertexResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI service error (${vertexResponse.status})`);
      }

      vertexData = await vertexResponse.json();
      const parts = vertexData?.candidates?.[0]?.content?.parts || [];
      const allText = parts.map((p: any) => p.text ?? "").join("\n");
      const nonThoughtText = parts.filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("\n");
      const aiResponse = (nonThoughtText.trim() || allText.trim());
      console.log(`[ai-vv-plan-generator] Attempt ${attempt + 1}: len=${aiResponse.length}`);

      if (!aiResponse) { if (attempt === 0) continue; throw new Error("No content generated"); }

      try {
        let parsed: any;
        try { parsed = JSON.parse(aiResponse); }
        catch {
          const cbm = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (cbm) parsed = JSON.parse(cbm[1]);
          else { const jm = aiResponse.match(/\{[\s\S]*\}/); if (jm) parsed = JSON.parse(jm[0]); else throw new Error("No JSON found"); }
        }
        plan = parsed;
        break;
      } catch (e) {
        console.error(`[ai-vv-plan-generator] Parse attempt ${attempt + 1} failed:`, e);
        if (attempt === 0) { plan = null; continue; }
        throw new Error("Failed to parse AI response");
      }
    }

    if (!plan) throw new Error("No plan generated");

    // Track token usage
    if (companyId && vertexData) {
      const detailedUsage = extractGeminiDetailedUsage(vertexData);
      if (detailedUsage) {
        EdgeRuntime.waitUntil(Promise.all([
          logAiTokenUsage({ companyId, userId, source: "ai_vv_plan", model: MODEL, usage: detailedUsage, metadata: { productName: productData.product_name ?? null, isFamily } }),
          trackTokenUsage(companyId, "google_vertex", { promptTokens: detailedUsage.inputTokens, completionTokens: detailedUsage.outputTokens, totalTokens: detailedUsage.totalTokens }),
        ]));
      }
    }

    console.log("[ai-vv-plan-generator] Generated plan:", plan.name);

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ai-vv-plan-generator] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
