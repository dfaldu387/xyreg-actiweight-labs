/**
 * AI Content Generator Edge Function
 *
 * Uses Google Vertex AI (Gemini) for auto-fill section content generation.
 * Supports generate, edit, and review modes.
 *
 * Request body: { prompt, sectionTitle, currentContent, companyId, referenceContext, outputLanguage, mode }
 * Response:     { success: boolean, content?: string, error?: string }
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { trackTokenUsage, extractGeminiDetailedUsage, logAiTokenUsage, checkAiCredits } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, sectionTitle, currentContent, companyId, referenceContext, outputLanguage, mode } = await req.json();
    console.log('[ai-content-generator] Request received:', { sectionTitle, hasPrompt: !!prompt, companyId, hasReferenceContext: !!referenceContext, outputLanguage, mode });

    if (!prompt) {
      throw new Error('Prompt is required');
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
      if (envKey) {
        decryptedKey = envKey;
        keySource = "env:GOOGLE_VERTEX_API_KEY";
      }
    }

    if (!decryptedKey) {
      return new Response(
        JSON.stringify({ success: false, error: "No Google Vertex AI credential configured for this company. Add a google_vertex key in Settings > API Keys." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    console.log("[ai-content-generator] Key source:", keySource, "| companyId:", companyId ?? "(none)");

    // --- Validate credential ---
    decryptedKey = decryptedKey.trim();
    const serviceAccount = tryParseServiceAccount(decryptedKey);
    if (!serviceAccount) {
      console.error("[ai-content-generator] Stored credential is not a valid service account JSON.");
      return new Response(
        JSON.stringify({ success: false, error: "Google Vertex AI credential must be a Google Cloud service-account JSON." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
    console.log("[ai-content-generator] Using Vertex AI for project:", sa.project_id);

    // Build the AI prompt with context
    const isEditMode = mode === 'edit' && currentContent;
    const isReviewMode = mode === 'review';

    let systemPrompt: string;

    if (isReviewMode) {
      systemPrompt = `You are an expert regulatory and quality reviewer specializing in medical device documentation and quality management systems.

You are REVIEWING existing document content. The user will ask a question about the content.
Provide clear, actionable feedback. Do NOT rewrite the content — give advisory answers only.
Structure your response with headings and bullet points for clarity.

Guidelines:
- Be specific about gaps, issues, or strengths
- Reference relevant standards (ISO 13485, ISO 14971, FDA 21 CFR Part 820, MDR) when applicable
- Use professional medical device industry language
- Return your response as clean HTML with <p>, <ul>, <li>, <h4>, <strong> tags
- Do NOT wrap in markdown code fences

${referenceContext ? `REFERENCE DOCUMENTS:\n${referenceContext}` : ''}
${outputLanguage && outputLanguage !== 'en' ? `CRITICAL: Generate ALL output in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.` : ''}`;
    } else if (isEditMode) {
      systemPrompt = `You are an expert technical writer specializing in medical device documentation and quality management systems.

You are EDITING an existing document section. The user will provide their current content and an instruction.
Modify the existing content according to the instruction.
Preserve the overall structure, tone, and formatting. Only change what the user asks for.
Return the full updated section content.

Guidelines:
- Preserve existing content that is not affected by the instruction
- Maintain professional medical device industry language
- Follow ISO 13485 and FDA 21 CFR Part 820 standards
- CRITICAL: Return ONLY raw HTML content - NO markdown, NO code blocks, NO \`\`\`html tags
- Start your response directly with HTML tags like <p>, <ul>, <h3>, etc.
- Do NOT wrap your response in markdown code fences
- Do NOT include any preamble or explanations

${referenceContext ? `The following block describes the ACTUAL company and device this document belongs to. Treat every value here as ground truth and use the real names verbatim — never substitute placeholders like "Acme", "[Company Name]", "the company", or generic device names. When the user says things like "add company", "add company name", "add the device", "our company", "this device", they mean the exact names below.

--- ACTIVE DEVICE & COMPANY CONTEXT ---
${referenceContext}
--- END ACTIVE CONTEXT ---` : ''}
${outputLanguage && outputLanguage !== 'en' ? `CRITICAL: Generate ALL output in ${outputLanguage === 'de' ? 'German' : outputLanguage === 'fr' ? 'French' : outputLanguage === 'fi' ? 'Finnish' : 'English'}.` : ''}`;
    } else {
      systemPrompt = `You are an expert technical writer specializing in medical device documentation and quality management systems.

Guidelines:
- Use professional medical device industry language
- Follow ISO 13485 and FDA 21 CFR Part 820 standards
- Be specific and actionable
- Include relevant compliance references when appropriate
- Structure content logically with clear sections
- Ensure content is comprehensive yet concise
- CRITICAL: Return ONLY raw HTML content - NO markdown, NO code blocks, NO \`\`\`html tags
- Start your response directly with HTML tags like <p>, <ul>, <h3>, etc.
- Do NOT wrap your response in markdown code fences (\`\`\`html or \`\`\`)
- Do NOT include any preamble, explanations, or introductory text
- Use well-formatted HTML with semantic tags: <p>, <ul>, <ol>, <li>, <h3>, <h4>, <strong>, <em>, <a>
- Use proper HTML structure for lists, paragraphs, and headings
- Make links clickable using <a href="..."> tags where relevant

${referenceContext ? `IMPORTANT: The following reference documents have been provided as context. Use them as the PRIMARY source of truth for generating content. Adapt terminology, structure, and details from these documents.

--- REFERENCE DOCUMENTS ---
${referenceContext}
--- END REFERENCE DOCUMENTS ---` : ''}

${outputLanguage && outputLanguage !== 'en' ? `CRITICAL LANGUAGE INSTRUCTION: Generate ALL output text in ${
  outputLanguage === 'de' ? 'German (Deutsch)' :
  outputLanguage === 'fr' ? 'French (Français)' :
  outputLanguage === 'fi' ? 'Finnish (Suomi)' :
  'English'
}. Every heading, paragraph, list item, and label must be in this language. Do NOT mix languages.` : ''}`;
    }

    const userPrompt = isReviewMode
      ? `Document "${sectionTitle}" content:\n${currentContent}\n\nQuestion: ${prompt}`
      : isEditMode
      ? `Current content of the "${sectionTitle}" section:\n${currentContent}\n\nInstruction: ${prompt}`
      : prompt;

    // Convert to Gemini format
    const contents = [
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    console.log('[ai-content-generator] Calling Vertex AI | mode:', mode ?? 'generate');

    // --- Call Vertex AI ---
    const vertexResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error('[ai-content-generator] Vertex API error:', vertexResponse.status, errorText);

      if (vertexResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      throw new Error(`AI service error (${vertexResponse.status}): ${errorText}`);
    }

    const vertexData = await vertexResponse.json();
    const generatedContent = vertexData?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!generatedContent) {
      console.error('[ai-content-generator] No content in response:', JSON.stringify(vertexData));
      throw new Error('No content generated by AI');
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
              source: 'auto_fill_section',
              model: MODEL,
              usage: detailedUsage,
              metadata: { sectionTitle: sectionTitle ?? null, mode: mode ?? 'generate' },
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
      JSON.stringify({
        success: true,
        content: generatedContent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ai-content-generator] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
