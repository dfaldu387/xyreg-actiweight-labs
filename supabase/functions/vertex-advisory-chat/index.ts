/**
 * Vertex Advisory Chat Edge Function
 *
 * Uses Google Vertex AI (Gemini) for the advisory bot chat.
 * Supports two authentication methods:
 * 1. Service Account JSON from company_api_keys table (key_type = 'google_vertex')
 * 2. Fallback to GOOGLE_VERTEX_API_KEY environment variable
 *
 * Request body: { messages, systemPrompt, agentId, companyId? }
 * Response:     { content: string }
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

// Normalize a stored credential into strict JSON so JSON.parse can handle:
//  - JS object-literal form (unquoted keys, trailing ; and/or trailing commas)
//  - Double-stringified JSON
function normalizeToJson(input: string): string {
  let s = input.trim();
  // Un-stringify once if wrapped in outer quotes: "\"{...}\""
  if (s.startsWith('"') && s.endsWith('"')) {
    try { s = JSON.parse(s); } catch { /* fall through */ }
  }
  if (typeof s !== "string") return s;
  s = s.trim().replace(/;+\s*$/, ""); // strip trailing ';'
  // Quote unquoted object keys: {foo: ...} or , foo: ... -> "foo":
  s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  // Strip trailing commas inside objects/arrays: ,} or ,]
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

function tryParseServiceAccount(key: string): ServiceAccount | null {
  try {
    const normalized = normalizeToJson(key);
    const parsed = typeof normalized === "string" ? JSON.parse(normalized) : normalized;
    if (
      parsed &&
      parsed.type === "service_account" &&
      parsed.private_key &&
      parsed.client_email &&
      parsed.project_id
    ) {
      return parsed as ServiceAccount;
    }
    return null;
  } catch {
    return null;
  }
}

async function getAccessTokenFromServiceAccount(sa: ServiceAccount): Promise<string> {
  const privateKeyPem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "")
    .trim();

  const privateKeyBytes = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const now = getNumericDate(new Date());
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    },
    cryptoKey,
  );

  const tokenResponse = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
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
    const { messages, systemPrompt, agentId, companyId } = await req.json();

    if (!messages || !Array.isArray(messages) || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing messages or systemPrompt" }),
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
    // Only use the caller's own company key, then fall back to env var.
    // (Do NOT grab "any" google_vertex row from another company — that masks
    // misconfiguration and can pick up stale/invalid keys.)
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
      if (envKey) {
        decryptedKey = envKey;
        keySource = "env:GOOGLE_VERTEX_API_KEY";
      }
    }

    if (!decryptedKey) {
      return new Response(
        JSON.stringify({ error: "No Google Vertex AI credential configured for this company. Add a google_vertex key in Settings > API Keys." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log("[vertex-advisory-chat] Key source:", keySource, "| companyId:", companyId ?? "(none)");

    // --- Build Vertex AI request ---
    // SECURITY: We only allow the Vertex AI (GCP) endpoint, which under Google
    // Cloud's Vertex AI Generative AI terms does NOT use customer data to train
    // foundation models and is not human-reviewed. The consumer Gemini API at
    // generativelanguage.googleapis.com is intentionally NOT supported here,
    // because its free tier uses prompts for model training.
    decryptedKey = decryptedKey.trim();
    const serviceAccount = tryParseServiceAccount(decryptedKey);
    if (!serviceAccount) {
      console.error("[vertex-advisory-chat] Stored credential is not a valid service account JSON. Refusing to fall back to the consumer Gemini endpoint.");
      return new Response(
        JSON.stringify({
          error: "Google Vertex AI credential must be a Google Cloud service-account JSON. The consumer Gemini API key is not supported because its data is used for training.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sa = serviceAccount;
    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${sa.project_id}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    };
    console.log("[vertex-advisory-chat] Using Vertex AI (no-training) for project:", sa.project_id);

    // Convert chat messages to Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    console.log("[vertex-advisory-chat] Calling:", url.split("?")[0], "| messages:", contents.length, "| hasSystem:", !!systemPrompt);

    // --- Call Vertex AI ---
    const vertexResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error("[vertex-advisory-chat] Vertex API error:", vertexResponse.status, "| keySource:", keySource, errorText);
      return new Response(
        JSON.stringify({ error: `AI service error (${vertexResponse.status}): ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vertexData = await vertexResponse.json();
    const content = vertexData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI returned no content" }),
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
              source: 'professor_xyreg',
              model: MODEL,
              usage: detailedUsage,
              metadata: { agentId: agentId ?? null },
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
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[vertex-advisory-chat] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
