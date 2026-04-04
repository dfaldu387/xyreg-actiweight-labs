import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Simple encryption/decryption utility for API keys
function decryptApiKey(encryptedKey: string): string {
  try {
    // If key looks like a plain text API key, return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-')) {
      return encryptedKey;
    }

    const ENCRYPTION_KEY = 'medtech-api-key-2024';
    // Reverse the process: base64 decode then XOR decrypt
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

interface DocumentChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  page_number: number;
  section_title: string;
  similarity: number;
  keyword_score: number;
  combined_score: number;
}

interface ResponseSource {
  chunk_id: string;
  page_number: number;
  section_title: string;
  chunk_text: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, reportId, companyId, userId } = await req.json();

    if (!query || !reportId || !companyId || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['query', 'reportId', 'companyId', 'userId']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing single-report query:', { query, reportId, companyId, userId });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company's Gemini API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('company_api_keys')
      .select('encrypted_key')
      .eq('company_id', companyId)
      .eq('key_type', 'gemini')
      .single();

    if (keyError || !apiKeyData) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API key not configured',
        message: 'Please configure your Gemini API key in Company Settings > General.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = decryptApiKey(apiKeyData.encrypted_key);

    // Step 1: Search for relevant chunks from this specific report only
    // For now, use a simple text search since we don't have Gemini embeddings
    const { data: searchResults, error: searchError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('report_id', reportId)
      .textSearch('chunk_text', query.replace(/\s+/g, ' | '))
      .limit(6);

    if (searchError) {
      console.error('Search error:', searchError);
      return new Response(JSON.stringify({ 
        error: 'Failed to search document chunks',
        details: searchError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Search results:', searchResults?.length || 0);

    if (!searchResults || searchResults.length === 0) {
      return new Response(JSON.stringify({
        answer: "I couldn't find relevant information about your question in this specific document. The document may not contain content related to your query, or it might not have been fully processed yet.",
        sources: [],
        query: query,
        reportId: reportId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Get report metadata for context
    const { data: reportData, error: reportError } = await supabase
      .from('market_reports')
      .select('title, source, report_date, description')
      .eq('id', reportId)
      .eq('company_id', companyId)
      .single();

    if (reportError) {
      console.error('Report fetch error:', reportError);
    }

    // Step 3: Generate AI response using Gemini
    const context = searchResults.map((chunk, index) => 
      `[Page ${chunk.page_number}] ${chunk.section_title || 'Content'}: ${chunk.chunk_text}`
    ).join('\n\n');

    const reportContext = reportData ? 
      `Report: "${reportData.title}" by ${reportData.source} (${reportData.report_date || 'Date not specified'})` : 
      'Current report';

    const prompt = `You are analyzing a specific market intelligence report. Please answer the user's question based ONLY on the content from this document.

${reportContext}

Document Content:
${context}

User Question: ${query}

Instructions:
- Answer based ONLY on the provided document content
- If the information isn't in the document, clearly state that
- Include specific page numbers when referencing information
- Be precise and cite relevant sections
- Focus on factual information from the document
- If you mention statistics or data, include the page number where it appears

Answer:`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate AI response',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    // Step 4: Prepare sources for citation
    const sources: ResponseSource[] = searchResults.map(chunk => ({
      chunk_id: chunk.id,
      page_number: chunk.page_number,
      section_title: chunk.section_title || 'Document Content',
      chunk_text: chunk.chunk_text.substring(0, 300) + (chunk.chunk_text.length > 300 ? '...' : ''),
      confidence: 0.8 // Default confidence for text search
    }));

    // Step 5: Save the chat session
    const { error: insertError } = await supabase
      .from('report_chat_sessions')
      .insert({
        report_id: reportId,
        user_id: userId,
        company_id: companyId,
        query_text: query,
        ai_response: answer,
        response_sources: sources
      });

    if (insertError) {
      console.error('Failed to save chat session:', insertError);
      // Don't fail the request, just log the error
    }

    console.log('Successfully processed single-report query');

    return new Response(JSON.stringify({
      answer,
      sources,
      query,
      reportId,
      reportTitle: reportData?.title || 'Unknown Report'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-single-report function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});