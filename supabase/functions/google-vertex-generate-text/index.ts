/**
 * Google Vertex AI Generate Text Edge Function
 * 
 * This function supports two authentication methods:
 * 1. API Key: Simple string API key (for Generative Language API)
 * 2. Service Account: JSON service account file (for OAuth authentication)
 * 
 * When a service account JSON is provided, the function will:
 * - Parse the service account JSON
 * - Create a JWT signed with the private key
 * - Exchange the JWT for an OAuth access token
 * - Use the access token to authenticate with Vertex AI
 * 
 * The service account JSON should be stored in the company_api_keys table
 * with key_type = 'google_vertex' and encrypted_key containing the full JSON string.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { trackTokenUsage, extractGeminiUsage } from "../_shared/token-tracking.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-1.5-pro-001";

function decryptApiKey(encryptedKey: string): string {
  // TODO: replace with real decryption once encryption-at-rest is implemented
  return encryptedKey;
}

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

async function getAccessTokenFromServiceAccount(serviceAccount: ServiceAccount): Promise<string> {
  try {
    // Prepare the private key for crypto.subtle
    const privateKeyPem = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\n/g, "")
      .trim();

    // Decode base64 private key
    const privateKeyBytes = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

    // Import the private key
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBytes,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    // Create JWT payload
    const now = getNumericDate(new Date());
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: serviceAccount.token_uri,
      iat: now,
      exp: now + 3600, // 1 hour expiry
      scope: "https://www.googleapis.com/auth/cloud-platform",
    };

    // Create and sign JWT
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      payload,
      cryptoKey,
    );

    // Exchange JWT for access token
    const tokenResponse = await fetch(serviceAccount.token_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[google-vertex-generate-text] Token exchange error:", errorText);
      throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("No access token in response");
    }

    return tokenData.access_token;
  } catch (error) {
    console.error("[google-vertex-generate-text] Service account auth error:", error);
    throw error;
  }
}

function isServiceAccountJson(key: string): boolean {
  try {
    const parsed = JSON.parse(key);
    return (
      parsed.type === "service_account" &&
      parsed.private_key &&
      parsed.client_email &&
      parsed.token_uri &&
      parsed.project_id
    );
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase admin credentials are not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      companyId,
      prompt,
      systemPrompt,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxOutputTokens = 1024,
      responseMimeType = "text/plain",
      safetySettings,
    } = body;

    if (!companyId || !prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "companyId and prompt are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vertexKeyRecord = await supabaseAdmin
      .from("company_api_keys")
      .select("encrypted_key, key_type")
      .eq("company_id", companyId)
      .eq("key_type", "google_vertex")
      .maybeSingle();

    const decryptedKey = vertexKeyRecord.data?.encrypted_key
      ? decryptApiKey(vertexKeyRecord.data.encrypted_key)
      : Deno.env.get("GOOGLE_VERTEX_API_KEY") || "";

    if (!decryptedKey) {
      return new Response(
        JSON.stringify({ success: false, error: "No Google Vertex AI credential configured for this company" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let accessToken: string | null = null;
    let apiKey: string | null = null;
    let projectId: string | null = null;
    const isServiceAccount = isServiceAccountJson(decryptedKey);

    if (isServiceAccount) {
      try {
        const serviceAccount = JSON.parse(decryptedKey) as ServiceAccount;
        projectId = serviceAccount.project_id;
        console.log("[google-vertex-generate-text] Using company service account authentication");
        accessToken = await getAccessTokenFromServiceAccount(serviceAccount);
      } catch (error) {
        console.error("[google-vertex-generate-text] Service account authentication failed:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Service account authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      apiKey = decryptedKey;
    }

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType,
      },
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        role: "system",
        parts: [{ text: systemPrompt }],
      };
    }

    if (safetySettings) {
      payload.safetySettings = safetySettings;
    }

    // Build request URL and headers based on authentication method
    let url: string;

    if (accessToken && projectId) {
      // Use Vertex AI endpoint with service account authentication
      const location = "us-central1"; // Default location
      url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
      console.log("[google-vertex-generate-text] Using Vertex AI endpoint:", url);
    } else if (apiKey) {
      // Use Generative Language API with API key
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log("[google-vertex-generate-text] Using Generative Language API endpoint");
    } else {
      throw new Error("No valid authentication method available");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const vertexResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error("[google-vertex-generate-text] Vertex API error:", vertexResponse.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Vertex API error (${vertexResponse.status}): ${errorText}`,
        }),
        { status: vertexResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const vertexData = await vertexResponse.json();
    const generatedText = vertexData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!generatedText) {
      return new Response(
        JSON.stringify({ success: false, error: "Vertex returned no content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const usage = extractGeminiUsage(vertexData);
    if (usage) {
      EdgeRuntime.waitUntil(trackTokenUsage(companyId, "google_vertex", usage));
    }

    return new Response(
      JSON.stringify({ success: true, content: generatedText, raw: vertexData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[google-vertex-generate-text] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

