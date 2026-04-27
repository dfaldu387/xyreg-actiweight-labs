import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { checkAiCredits, logAiTokenUsage, trackTokenUsage, extractGeminiDetailedUsage } from "../_shared/token-tracking.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const MODEL = "gemini-2.5-flash";
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// --- Service Account Authentication (same as vertex-advisory-chat) ---

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
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", privateKeyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
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
  if (!tokenResponse.ok) throw new Error(`Token exchange failed: ${tokenResponse.status}`);
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error("No access token in response");
  return tokenData.access_token;
}

// --- Types ---

interface SearchRequest {
  query: string;
  companyId: string;
  userId: string;
  maxResults?: number;
}

interface DocumentChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  page_number?: number;
  section_title?: string;
  word_count?: number;
  similarity?: number;
  keyword_score?: number;
  combined_score?: number;
  report_id: string;
  report_title?: string;
  report_source?: string;
  report_date?: string;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { query, companyId, userId, maxResults = 8 }: SearchRequest = await req.json();
    console.log('[ask-reports] Request:', { query, companyId, userId, maxResults });

    if (!query || !companyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, companyId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check AI credits
    const creditCheck = await checkAiCredits(companyId);
    if (!creditCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "NO_CREDITS", message: "No AI credits remaining.", used: creditCheck.used, limit: creditCheck.limit }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Generate embedding (keep OpenAI — vectors in DB are 1536-dim)
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured for embeddings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('[ask-reports] Generating query embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-ada-002', input: query }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI embedding failed: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Hybrid search
    console.log('[ask-reports] Performing hybrid search...');
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_documents_hybrid', {
      query_embedding: JSON.stringify(queryEmbedding),
      query_text: query,
      match_company_id: companyId,
      match_count: maxResults
    });

    let chunks: DocumentChunk[] = [];

    if (vectorError) {
      console.error('[ask-reports] Vector search error, using fallback:', vectorError);
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('document_chunks')
        .select(`*, market_reports!inner(id, title, source, report_date, company_id)`)
        .eq('market_reports.company_id', companyId)
        .textSearch('chunk_text', query)
        .limit(maxResults);

      if (fallbackError) throw new Error(`Search failed: ${fallbackError.message}`);

      chunks = (fallbackResults || []).map((c: any) => ({
        id: c.id, chunk_text: c.chunk_text, chunk_index: c.chunk_index, page_number: c.page_number,
        section_title: c.section_title, word_count: c.word_count, similarity: 0.7, keyword_score: 0.8,
        combined_score: 0.75, report_id: c.market_reports.id, report_title: c.market_reports.title,
        report_source: c.market_reports.source, report_date: c.market_reports.report_date,
      }));
    } else {
      chunks = vectorResults || [];
    }

    console.log(`[ask-reports] Found ${chunks.length} relevant chunks`);

    if (chunks.length === 0) {
      return new Response(JSON.stringify({
        answer: "I couldn't find any relevant information in the available reports. Please try rephrasing your query or check if relevant reports have been uploaded.",
        sources: [], query, responseTime: Date.now() - startTime, confidence: 0, searchQueryId: '',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: Resolve Vertex AI credential
    let decryptedKey = "";
    if (companyId) {
      const { data: keyRecord } = await supabase
        .from("company_api_keys")
        .select("encrypted_key")
        .eq("company_id", companyId)
        .eq("key_type", "google_vertex")
        .maybeSingle();
      if (keyRecord?.encrypted_key) decryptedKey = keyRecord.encrypted_key;
    }
    if (!decryptedKey) {
      decryptedKey = Deno.env.get("GOOGLE_VERTEX_API_KEY") || "";
    }
    if (!decryptedKey) {
      return new Response(JSON.stringify({ error: "No Google Vertex AI credential configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceAccount = tryParseServiceAccount(decryptedKey.trim());
    if (!serviceAccount) {
      return new Response(JSON.stringify({ error: "Invalid Vertex AI service account credential." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getAccessTokenFromServiceAccount(serviceAccount);
    const location = "us-central1";
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${serviceAccount.project_id}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;

    // Step 4: Build RAG prompt
    const context = chunks.map((chunk, i) => {
      const pageRef = chunk.page_number ? `, Page ${chunk.page_number}` : '';
      const sectionRef = chunk.section_title ? `, Section: ${chunk.section_title}` : '';
      return `[Source ${i + 1}: ${chunk.report_title} by ${chunk.report_source}${pageRef}${sectionRef}]\n${chunk.chunk_text}`;
    }).join('\n\n');

    const ragPrompt = `You are an expert market intelligence analyst. Answer the user's question based ONLY on the provided context from market research reports.

IMPORTANT INSTRUCTIONS:
1. Answer only based on the provided context - do not use external knowledge
2. Include specific citations using this format: [Source X]
3. If the context doesn't contain enough information, say so clearly
4. Provide a comprehensive but concise answer
5. Highlight key data points, market sizes, growth rates, and trends when relevant

USER QUESTION: ${query}

CONTEXT:
${context}

ANSWER:`;

    console.log('[ask-reports] Calling Vertex AI:', url.split("?")[0]);

    const vertexResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: ragPrompt }] }],
        systemInstruction: { parts: [{ text: "You are a market intelligence expert that provides accurate, cited answers based on research reports." }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
      }),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error('[ask-reports] Vertex AI error:', errorText);
      throw new Error(`Vertex AI failed: ${vertexResponse.status}`);
    }

    const vertexData = await vertexResponse.json();
    const answer = vertexData.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate a response.";

    // Track token usage
    const detailedUsage = extractGeminiDetailedUsage(vertexData);
    if (detailedUsage && companyId) {
      EdgeRuntime.waitUntil(
        Promise.all([
          logAiTokenUsage({
            companyId, userId, source: 'ask_reports', model: MODEL,
            usage: detailedUsage,
          }),
          trackTokenUsage(companyId, 'google_vertex', {
            promptTokens: detailedUsage.inputTokens,
            completionTokens: detailedUsage.outputTokens,
            totalTokens: detailedUsage.totalTokens,
          }),
        ])
      );
    }

    // Calculate confidence
    const avgSimilarity = chunks.reduce((sum, c) => sum + (c.similarity || 0.5), 0) / chunks.length;
    const confidence = Math.min(0.95, avgSimilarity + (chunks.length * 0.1));

    // Save search query
    const { data: savedQuery, error: saveError } = await supabase
      .from('search_queries')
      .insert({
        company_id: companyId, user_id: userId, query_text: query, ai_response: answer,
        source_chunks: chunks.map(c => ({ id: c.id, similarity: c.similarity, report_id: c.report_id, report_title: c.report_title, page_number: c.page_number })),
        response_time_ms: Date.now() - startTime
      })
      .select().single();

    if (saveError) console.error('[ask-reports] Error saving search query:', saveError);

    console.log('[ask-reports] Search completed successfully');
    return new Response(JSON.stringify({
      answer, sources: chunks, query, responseTime: Date.now() - startTime, confidence, searchQueryId: savedQuery?.id || '',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[ask-reports] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
