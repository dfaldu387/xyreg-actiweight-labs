import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { trackTokenUsage, extractGeminiUsage } from "../_shared/token-tracking.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Service Account Key for Vertex AI
const SERVICE_ACCOUNT_KEY = {
  type: "service_account",
  project_id: "graphic-abbey-359311",
  private_key_id: "f8f88fc7d7250cc4c26ba9eea98ffc59df71dcd0",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3ktwOrCM6evAd\nwuiPD36EpcZqp/kKRcbalSEUKiZ5mslwejB/UGMrQYwDfQ97oVlvg6mg90BLwHwA\nFVCzLiSgllFrNErzERmPjmIbztp+d0Pld61OtLZJzGCg1Rj7iqV5n4Zg6Bg3wdLZ\nZaUVshfzDOIhFOauaZsRU0juyp+BF6RflFEut7E6rWh0P6Mm4N12XjmGWztmFK1f\nV2mXYQhl8arZSe1tzdz1tMDxIk4d9FtiQbz06kSyygAVAmhPR3iB5VSBEYlHw030\nS/bo38ln0OdEtxQvuljK07Se57Qf5KMeCU17GBgD/BZ6jN4tSX5vSbbFRJ0ZmtlD\nijlKh5CzAgMBAAECggEAVXXrOHFu3RTKoDBS7/b4oWxDmPel+uBNGQmAItEUpFwp\nF1HrLfoQkNytABrCkH2nE0EqQSOaLSnpEGjb7u62YoRYVx47HjmButFAX03HbkS7\nuSIj7pY2ntiky3spbEE5lAtuFcM3Mw3qyQaG+ji06ZO/2kLOube0VzZ8p55w7zl2\nFveDfrUNWkWTSh7vPSEQRgYMTbLDdmwpc4QEZ/4q5y+kjKhkEmBdCjLcUP6Y66pL\nX/jVWBB0Pp5Xe5BV3qy10TxWad3E5Jvrq0/WAg7sb2lDFN/n+P3tGZr/DimWLl2F\n6HfufNt/LjCy6P1Z81FVHGbjtdDtvlMMF2oMsgnOIQKBgQDoisnkH0mzhBxsE0My\nYA0YDND5F4+Usdn7z1PfwaJjQ5kg7aTqHG32nxlUNp/SjWmIlM4hFxkEXtv0YsuI\n/rF57gpzC2oRaOfwqIzq/wpWbcG/yD1I4yXrandW6XrIPkjXC1LNC7mvcAsqBYBv\nydd23kjsE3dXSS9zbsLzqbQV2QKBgQDKF4ADdAM+gwGTafIKnG9W7myPDkKSNDla\nJqotnwQLm1F527HCvJZToXg/In8LD12jpQYD7+SDgvJGFFHg2abBQkM68/dTENeA\nnEAvW0jvOS0wVDEw1fP6zAvPU2Icf1KPl9L9DAXrgkV1g22SHEPLEl7q6KvuilnB\nzlmWg4WHawKBgQDOhOvWH/9ZYZvIU7ca1vjqAf/ZKJaITQc1viRUFOi91Xv6JXOP\nwt3Z5+QbyUNZP+OYu+bwtk2udvxK5y6xpNhDXCeFkn6JpaxPK7GyxfwNU/587z2W\nLL0xfOUtl79GdSJFcTYBCkfHSe9wS2CMZypm0/TZTFRxfXqZvqV+tplLyQKBgQCW\ndzbF22vK8EmNE1W2FtFDHVPQk2J3btDA0YblXr7pUWQxYaSRhE48yD06bJnAh1lF\nzUmURtmSHT37dYec7RCeVZKu4xRjUWfShwO2/rVn/98oW5cgcDwuoBuu6rti0l2L\nMhRSedAykBTdMNS087x6BxyKtF/GxFWd2eCUEyqpLwKBgGwoNRxYwJMXrL764Kct\n8COCGcBCNyerXoVqtnPdMYQpNht1h1wZdVpKKjgXJtoMOgdAbg8aEPmtdrvhg8aW\nKkohk2bJjcIfR1uit7GXlI+Hm7YgCTQvLZ/1XX+laP4typyYQ41aekYv65gS0KNX\nKVd1aOdEH9nIf+bS+Y0jkSlc\n-----END PRIVATE KEY-----\n",
  client_email: "vertex-ai-client@graphic-abbey-359311.iam.gserviceaccount.com",
  client_id: "108837633377404927093",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/vertex-ai-client%40graphic-abbey-359311.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Get access token from service account using djwt library
async function getAccessTokenFromServiceAccount(): Promise<string> {
  const serviceAccount = SERVICE_ACCOUNT_KEY;

  const privateKeyPem = serviceAccount.private_key
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
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, cryptoKey);

  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DocumentSummaryRequest {
  action: 'generate_summary' | 'extract_key_points' | 'chat' | 'help_write';
  documentId: string;
  companyId: string;
  userId: string;
  text?: string;
  query?: string;
  context?: {
    documentName: string;
    documentType: string;
    phaseName: string;
  };
}

interface AIProvider {
  name: string;
  available: boolean;
  apiKey?: string;
}

interface KeyPoint {
  point: string;
  section?: string;
  pageNumber?: number;
  importance: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Document Summary function called');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody: DocumentSummaryRequest = await req.json();
    const { action, documentId, companyId, userId, text, query, context } = requestBody;

    console.log(`Action: ${action}, DocumentId: ${documentId}`);

    if (!documentId || !companyId || !userId) {
      throw new Error('Missing required parameters: documentId, companyId, userId');
    }

    // Get available AI providers
    const providers = await getAvailableAIProviders(supabase, companyId);

    if (providers.length === 0) {
      throw new Error('No AI providers configured. Please configure API keys in company settings.');
    }

    // Prefer Vertex AI (service account) > Gemini API key > others
    const selectedProvider = providers.find(p => p.name === 'vertex')
      || providers.find(p => p.name === 'gemini')
      || providers[0];
    console.log('Using AI provider:', selectedProvider.name);

    let result: any;

    switch (action) {
      case 'generate_summary':
        if (!text) throw new Error('Text content is required for summary generation');
        result = await generateSummary(selectedProvider, text, context);
        break;

      case 'extract_key_points':
        if (!text) throw new Error('Text content is required for key points extraction');
        result = await extractKeyPoints(selectedProvider, text, context);
        break;

      case 'chat':
        if (!query) throw new Error('Query is required for chat');
        result = await answerQuestion(selectedProvider, text || '', query, context);
        break;

      case 'help_write':
        if (!query) throw new Error('Prompt is required for writing assistance');
        result = await helpWrite(selectedProvider, query, context, text);
        break;

      default:
        throw new Error('Invalid action specified');
    }

    // Track token usage for Gemini/Vertex AI
    if ((selectedProvider.name === 'gemini' || selectedProvider.name === 'vertex') && result.usage) {
      EdgeRuntime.waitUntil(
        trackTokenUsage(companyId, 'gemini', result.usage)
      );
    }

    // Save session to database
    EdgeRuntime.waitUntil(
      saveSession(supabase, {
        documentId,
        userId,
        companyId,
        sessionType: action,
        queryText: query || null,
        aiResponse: JSON.stringify(result.data),
        responseMetadata: {
          provider: selectedProvider.name,
          tokensUsed: result.usage?.totalTokenCount || 0,
          generatedAt: new Date().toISOString()
        }
      })
    );

    return new Response(JSON.stringify({
      success: true,
      ...result.data,
      metadata: {
        provider: selectedProvider.name,
        tokensUsed: result.usage?.totalTokenCount || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-document-summary function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Generate document summary
async function generateSummary(provider: AIProvider, text: string, context?: any) {
  const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...(truncated)' : text;

  const prompt = `You are an expert document analyst. Analyze this document and provide a comprehensive summary.

${context ? `DOCUMENT INFO:
- Name: ${context.documentName}
- Type: ${context.documentType}
- Phase: ${context.phaseName}
` : ''}

DOCUMENT CONTENT:
"""
${truncatedText}
"""

Provide a JSON response with this structure:
{
  "summary": "A comprehensive 3-5 paragraph summary of the document covering its main purpose, key content, and conclusions",
  "quickSummary": "A 2-3 sentence executive summary",
  "sections": [
    {
      "title": "Section title",
      "summary": "Brief summary of this section"
    }
  ],
  "documentType": "Detected document type",
  "wordCount": approximate_word_count,
  "complexity": "low|medium|high"
}

Return ONLY valid JSON, no other text.`;

  return await callAI(provider, prompt);
}

// Extract key points from document
async function extractKeyPoints(provider: AIProvider, text: string, context?: any) {
  const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...(truncated)' : text;

  const prompt = `You are an expert document analyst. Extract the key points from this document.

${context ? `DOCUMENT INFO:
- Name: ${context.documentName}
- Type: ${context.documentType}
- Phase: ${context.phaseName}
` : ''}

DOCUMENT CONTENT:
"""
${truncatedText}
"""

Extract and categorize the key points. Provide a JSON response:
{
  "keyPoints": [
    {
      "point": "The key point statement",
      "section": "Section where this was found (if identifiable)",
      "importance": "high|medium|low",
      "category": "requirement|procedure|finding|recommendation|definition|other"
    }
  ],
  "totalPoints": number_of_points,
  "categories": {
    "requirements": count,
    "procedures": count,
    "findings": count,
    "recommendations": count,
    "definitions": count,
    "other": count
  },
  "topThemes": ["theme1", "theme2", "theme3"]
}

Focus on:
- Requirements and specifications
- Procedures and processes
- Key findings and results
- Important recommendations
- Critical definitions

Return ONLY valid JSON, no other text.`;

  return await callAI(provider, prompt);
}

// Answer questions about the document
async function answerQuestion(provider: AIProvider, text: string, query: string, context?: any) {
  const truncatedText = text.length > 12000 ? text.substring(0, 12000) + '...(truncated)' : text;

  const prompt = `You are a helpful document assistant. Answer questions about the document based ONLY on the content provided.

${context ? `DOCUMENT INFO:
- Name: ${context.documentName}
- Type: ${context.documentType}
- Phase: ${context.phaseName}
` : ''}

DOCUMENT CONTENT:
"""
${truncatedText}
"""

USER QUESTION: ${query}

Provide a JSON response:
{
  "answer": "Your detailed answer based on the document content",
  "confidence": "high|medium|low",
  "relevantExcerpts": [
    {
      "text": "Relevant excerpt from the document",
      "section": "Section name if identifiable"
    }
  ],
  "followUpQuestions": ["Suggested follow-up question 1", "Suggested follow-up question 2"]
}

IMPORTANT:
- Only answer based on information in the document
- If the answer is not in the document, say so clearly
- Cite relevant sections when possible
- Suggest follow-up questions the user might ask

Return ONLY valid JSON, no other text.`;

  return await callAI(provider, prompt);
}

// Help write content based on the document
async function helpWrite(provider: AIProvider, prompt: string, context?: any, documentText?: string) {
  const truncatedText = documentText && documentText.length > 8000
    ? documentText.substring(0, 8000) + '...(truncated)'
    : documentText || '';

  const systemPrompt = `You are a professional technical writer specializing in medical device documentation. Help the user write content based on their request.

${context ? `DOCUMENT CONTEXT:
- Name: ${context.documentName}
- Type: ${context.documentType}
- Phase: ${context.phaseName}
` : ''}

${truncatedText ? `REFERENCE DOCUMENT:
"""
${truncatedText}
"""
` : ''}

USER REQUEST: ${prompt}

Generate professional, well-structured content. Provide a JSON response:
{
  "content": "The generated content in HTML format (use <p>, <ul>, <li>, <h3>, <h4>, <strong>, <em> tags)",
  "contentPlain": "The same content in plain text",
  "suggestions": ["Suggestion for improvement 1", "Suggestion for improvement 2"],
  "wordCount": approximate_word_count
}

GUIDELINES:
- Use professional, clear language
- Follow medical device documentation standards
- Structure content logically with appropriate headings
- Be concise but comprehensive
- Match the style of the reference document if provided

Return ONLY valid JSON, no other text.`;

  return await callAI(provider, systemPrompt);
}

// Call AI provider
async function callAI(provider: AIProvider, prompt: string) {
  console.log('callAI called with provider:', provider.name);

  // Try Vertex AI first (using hardcoded service account)
  if (provider.name === 'gemini' || provider.name === 'vertex') {
    try {
      console.log('Using Vertex AI with service account');
      return await callVertexAI(prompt);
    } catch (err) {
      console.error('Vertex AI error:', err);
      // Fall back to API key if available
      if (provider.apiKey) {
        console.log('Falling back to Gemini API with API key');
        return await callGemini(provider.apiKey, prompt);
      }
      throw err;
    }
  }

  if (provider.name === 'openai') {
    return await callOpenAI(provider.apiKey!, prompt);
  }

  if (provider.name === 'anthropic') {
    return await callAnthropic(provider.apiKey!, prompt);
  }

  throw new Error(`Unsupported AI provider: ${provider.name}`);
}

// Call Vertex AI (Google Cloud) with service account
async function callVertexAI(prompt: string) {
  const projectId = SERVICE_ACCOUNT_KEY.project_id;
  const location = 'us-central1';
  const model = 'gemini-2.0-flash-001';

  // Get access token from service account
  const accessToken = await getAccessTokenFromServiceAccount();

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Vertex AI error:', error);
    throw new Error(`Vertex AI error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim() || '';

  let parsedData;
  try {
    parsedData = JSON.parse(textContent);
  } catch {
    parsedData = { rawResponse: textContent };
  }

  return {
    data: parsedData,
    usage: extractGeminiUsage(data)
  };
}

// Call Gemini API
async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  let parsedData;
  try {
    parsedData = JSON.parse(textContent);
  } catch {
    parsedData = { rawResponse: textContent };
  }

  return {
    data: parsedData,
    usage: extractGeminiUsage(data)
  };
}

// Call OpenAI API
async function callOpenAI(apiKey: string, prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful document analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || '';

  let parsedData;
  try {
    parsedData = JSON.parse(textContent);
  } catch {
    parsedData = { rawResponse: textContent };
  }

  return {
    data: parsedData,
    usage: {
      promptTokenCount: data.usage?.prompt_tokens,
      candidatesTokenCount: data.usage?.completion_tokens,
      totalTokenCount: data.usage?.total_tokens
    }
  };
}

// Call Anthropic API
async function callAnthropic(apiKey: string, prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.content?.[0]?.text || '';

  let parsedData;
  try {
    parsedData = JSON.parse(textContent);
  } catch {
    parsedData = { rawResponse: textContent };
  }

  return {
    data: parsedData,
    usage: {
      promptTokenCount: data.usage?.input_tokens,
      candidatesTokenCount: data.usage?.output_tokens,
      totalTokenCount: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

// Save session to database
async function saveSession(supabase: any, session: {
  documentId: string;
  userId: string;
  companyId: string;
  sessionType: string;
  queryText: string | null;
  aiResponse: string;
  responseMetadata: any;
}) {
  try {
    const { error } = await supabase
      .from('document_ai_sessions')
      .insert({
        document_id: session.documentId,
        user_id: session.userId,
        company_id: session.companyId,
        session_type: session.sessionType,
        query_text: session.queryText,
        ai_response: session.aiResponse,
        response_metadata: session.responseMetadata
      });

    if (error) {
      console.error('Error saving session:', error);
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Decrypt API key
function decryptApiKey(encryptedKey: string): string {
  try {
    const ENCRYPTION_KEY = 'medtech-api-key-2024';

    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-')) {
      return encryptedKey;
    }

    const base64Decoded = atob(encryptedKey);
    const decrypted = Array.from(base64Decoded)
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return encryptedKey;
  }
}

// Get available AI providers
async function getAvailableAIProviders(supabase: any, companyId: string): Promise<AIProvider[]> {
  try {
    const providers: AIProvider[] = [];

    // Vertex AI is always available (hardcoded service account)
    providers.push({
      name: 'vertex',
      available: true,
      apiKey: undefined // Uses hardcoded service account
    });
    console.log('Vertex AI available (hardcoded service account)');

    // Also check company-specific API keys as fallbacks
    const { data: apiKeys, error } = await supabase
      .from('company_api_keys')
      .select('key_type, encrypted_key')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching company API keys:', error);
    }

    const geminiKey = apiKeys?.find((key: any) => key.key_type === 'gemini');
    if (geminiKey) {
      providers.push({
        name: 'gemini',
        available: true,
        apiKey: decryptApiKey(geminiKey.encrypted_key)
      });
    }

    const openaiKey = apiKeys?.find((key: any) => key.key_type === 'openai');
    if (openaiKey) {
      providers.push({
        name: 'openai',
        available: true,
        apiKey: decryptApiKey(openaiKey.encrypted_key)
      });
    }

    const anthropicKey = apiKeys?.find((key: any) => key.key_type === 'anthropic');
    if (anthropicKey) {
      providers.push({
        name: 'anthropic',
        available: true,
        apiKey: decryptApiKey(anthropicKey.encrypted_key)
      });
    }

    return providers;
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    // Even if there's an error, Vertex AI is always available (hardcoded service account)
    return [{ name: 'vertex', available: true, apiKey: undefined }];
  }
}
