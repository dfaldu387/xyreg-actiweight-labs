/**
 * Vertex AI Suggestion Edge Function
 *
 * General-purpose Vertex AI (Gemini) proxy for AI Suggestions in Device Definition.
 * Replaces direct consumer Gemini API calls from the frontend.
 *
 * Request body: { prompt, companyId, inlineData? }
 *   - prompt: string — the full prompt text
 *   - companyId: string — for credential lookup and token tracking
 *   - inlineData?: { mimeType: string, data: string } — for PDF/image uploads
 * Response:     { success: boolean, text?: string, usageMetadata?: object, error?: string }
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { trackTokenUsage, extractGeminiDetailedUsage, logAiTokenUsage, checkAiCredits } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "gemini-2.5-flash";

// --- Service Account Authentication ---

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  client_x509_cert_url: string;
}

function normalizeToJson(input: string): string {
  let s = input.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    try { s = JSON.parse(s); } catch { /* fall through */ }
  }
  if (typeof s !== "string") return s;
  s = s.trim().replace(/;+\s*$/, "");
  s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

function tryParseServiceAccount(key: string): ServiceAccount | null {
  try {
    const normalized = normalizeToJson(key);
    const parsed = typeof normalized === "string" ? JSON.parse(normalized) : normalized;
    if (parsed?.type === "service_account" && parsed.private_key && parsed.client_email && parsed.project_id) {
      return parsed as ServiceAccount;
    }
    return null;
  } catch { return null; }
}

async function getAccessTokenFromServiceAccount(sa: ServiceAccount): Promise<string> {
  const privateKeyPem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "")
    .trim();
  const privateKeyBytes = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", privateKeyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = getNumericDate(new Date());
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    { iss: sa.client_email, sub: sa.client_email, aud: sa.token_uri, iat: now, exp: now + 3600, scope: "https://www.googleapis.com/auth/cloud-platform" },
    cryptoKey,
  );
  const tokenResponse = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error("No access token in response");
  return tokenData.access_token;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, companyId, inlineData } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
    let decryptedKey = "";
    let keySource = "none";

    if (companyId) {
      const { data: keyRecord } = await supabase
        .from("company_api_keys")
        .select("encrypted_key")
        .eq("company_id", companyId)
        .eq("key_type", "google_vertex")
        .maybeSingle();
      if (keyRecord?.encrypted_key) {
        decryptedKey = keyRecord.encrypted_key;
        keySource = "company_api_keys";
      }
    }

    if (!decryptedKey) {
      const envKey = Deno.env.get("GOOGLE_VERTEX_API_KEY") || "";
      if (envKey) { decryptedKey = envKey; keySource = "env:GOOGLE_VERTEX_API_KEY"; }
    }

    if (!decryptedKey) {
      return new Response(
        JSON.stringify({ success: false, error: "No Google Vertex AI credential configured. Add a google_vertex key in Settings > API Keys." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    decryptedKey = decryptedKey.trim();
    const serviceAccount = tryParseServiceAccount(decryptedKey);
    if (!serviceAccount) {
      return new Response(
        JSON.stringify({ success: false, error: "Google Vertex AI credential must be a Google Cloud service-account JSON." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sa = serviceAccount;
    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${sa.project_id}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;

    console.log("[vertex-ai-suggestion] Using Vertex AI for project:", sa.project_id, "| keySource:", keySource);

    // Build request parts
    const parts: Record<string, unknown>[] = [];
    if (inlineData) {
      parts.push({ inline_data: { mime_type: inlineData.mimeType, data: inlineData.data } });
    }
    parts.push({ text: prompt });

    const payload = {
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    };

    const vertexResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error("[vertex-ai-suggestion] Vertex API error:", vertexResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `AI service error (${vertexResponse.status}): ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vertexData = await vertexResponse.json();
    const text = vertexData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: "AI returned no content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Track token usage (non-blocking) ---
    if (companyId) {
      const detailedUsage = extractGeminiDetailedUsage(vertexData);
      if (detailedUsage) {
        EdgeRuntime.waitUntil(
          Promise.all([
            logAiTokenUsage({
              companyId,
              userId,
              source: 'ai_suggestion',
              model: MODEL,
              usage: detailedUsage,
              metadata: { hasInlineData: !!inlineData },
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

    return new Response(
      JSON.stringify({ success: true, text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[vertex-ai-suggestion] Error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
