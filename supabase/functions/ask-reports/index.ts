import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

interface SearchResponse {
  answer: string;
  sources: DocumentChunk[];
  query: string;
  responseTime: number;
  confidence: number;
  searchQueryId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { query, companyId, userId, maxResults = 8 }: SearchRequest = await req.json();

    console.log('Ask Reports request:', { query, companyId, userId, maxResults });

    if (!query || !companyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, companyId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Generate embedding for the query
    console.log('Generating query embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorText);
      throw new Error(`OpenAI embedding failed: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Perform hybrid search (vector + keyword)
    console.log('Performing hybrid search...');
    
    // Vector similarity search with company filtering
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_documents_hybrid', {
      query_embedding: JSON.stringify(queryEmbedding),
      query_text: query,
      match_company_id: companyId,
      match_count: maxResults
    });

    if (vectorError) {
      console.error('Vector search error:', vectorError);
      // Fallback to basic search if hybrid search function doesn't exist
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('document_chunks')
        .select(`
          *,
          market_reports!inner(
            id,
            title,
            source,
            report_date,
            company_id
          )
        `)
        .eq('market_reports.company_id', companyId)
        .textSearch('chunk_text', query)
        .limit(maxResults);

      if (fallbackError) {
        throw new Error(`Search failed: ${fallbackError.message}`);
      }

      const chunks: DocumentChunk[] = (fallbackResults || []).map((chunk: any) => ({
        id: chunk.id,
        chunk_text: chunk.chunk_text,
        chunk_index: chunk.chunk_index,
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        word_count: chunk.word_count,
        similarity: 0.7, // Default similarity for keyword matches
        keyword_score: 0.8,
        combined_score: 0.75,
        report_id: chunk.market_reports.id,
        report_title: chunk.market_reports.title,
        report_source: chunk.market_reports.source,
        report_date: chunk.market_reports.report_date,
      }));

      console.log(`Found ${chunks.length} chunks using fallback search`);
      
      if (chunks.length === 0) {
        const noResultsResponse: SearchResponse = {
          answer: "I couldn't find any relevant information in the available reports to answer your question. Please try rephrasing your query or check if the relevant reports have been uploaded and processed.",
          sources: [],
          query,
          responseTime: Date.now() - startTime,
          confidence: 0,
          searchQueryId: '',
        };

        return new Response(JSON.stringify(noResultsResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Continue with RAG using fallback results
      return await generateRAGResponse(chunks, query, companyId, userId, startTime, supabase);
    }

    const chunks: DocumentChunk[] = vectorResults || [];
    console.log(`Found ${chunks.length} relevant chunks`);

    if (chunks.length === 0) {
      const noResultsResponse: SearchResponse = {
        answer: "I couldn't find any relevant information in the available reports to answer your question. Please try rephrasing your query or check if the relevant reports have been uploaded and processed.",
        sources: [],
        query,
        responseTime: Date.now() - startTime,
        confidence: 0,
        searchQueryId: '',
      };

      return new Response(JSON.stringify(noResultsResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Generate RAG response
    return await generateRAGResponse(chunks, query, companyId, userId, startTime, supabase);

  } catch (error) {
    console.error('Error in ask-reports function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateRAGResponse(
  chunks: DocumentChunk[], 
  query: string, 
  companyId: string, 
  userId: string, 
  startTime: number,
  supabase: any
): Promise<Response> {
  try {
    // Step 3: Construct RAG prompt with context
    console.log('Generating AI response...');
    
    const context = chunks.map((chunk, index) => {
      const pageRef = chunk.page_number ? `, Page ${chunk.page_number}` : '';
      const sectionRef = chunk.section_title ? `, Section: ${chunk.section_title}` : '';
      return `[Source ${index + 1}: ${chunk.report_title} by ${chunk.report_source}${pageRef}${sectionRef}]\n${chunk.chunk_text}`;
    }).join('\n\n');

    const ragPrompt = `You are an expert market intelligence analyst. Answer the user's question based ONLY on the provided context from market research reports. 

IMPORTANT INSTRUCTIONS:
1. Answer only based on the provided context - do not use external knowledge
2. Include specific citations in your answer using this format: [Source X]
3. If the context doesn't contain enough information to answer the question, say so clearly
4. Provide a comprehensive but concise answer
5. Highlight key data points, market sizes, growth rates, and trends when relevant
6. If multiple sources provide different information, mention both and cite each source

USER QUESTION: ${query}

CONTEXT:
${context}

ANSWER:`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a market intelligence expert that provides accurate, cited answers based on research reports.'
          },
          {
            role: 'user',
            content: ragPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI completion error:', errorText);
      throw new Error(`OpenAI completion failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Calculate confidence based on source relevance and chunk count
    const avgSimilarity = chunks.reduce((sum, chunk) => sum + (chunk.similarity || 0.5), 0) / chunks.length;
    const confidence = Math.min(0.95, avgSimilarity + (chunks.length * 0.1));

    // Step 4: Save search query to history
    console.log('Saving search query to history...');
    const { data: savedQuery, error: saveError } = await supabase
      .from('search_queries')
      .insert({
        company_id: companyId,
        user_id: userId,
        query_text: query,
        ai_response: answer,
        source_chunks: chunks.map(chunk => ({
          id: chunk.id,
          similarity: chunk.similarity,
          report_id: chunk.report_id,
          report_title: chunk.report_title,
          page_number: chunk.page_number
        })),
        response_time_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving search query:', saveError);
    }

    const response: SearchResponse = {
      answer,
      sources: chunks,
      query,
      responseTime: Date.now() - startTime,
      confidence,
      searchQueryId: savedQuery?.id || '',
    };

    console.log('Search completed successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw error;
  }
}

// RPC function for hybrid search - this would be created via migration
/*
CREATE OR REPLACE FUNCTION search_documents_hybrid(
  query_embedding vector(1536),
  query_text text,
  match_company_id uuid,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  chunk_index int,
  page_number int,
  section_title text,
  word_count int,
  similarity float,
  keyword_score float,
  combined_score float,
  report_id uuid,
  report_title text,
  report_source text,
  report_date date
)
LANGUAGE sql
AS $$
  WITH vector_search AS (
    SELECT 
      dc.*,
      (1 - (dc.embedding <=> query_embedding)) AS similarity,
      mr.title as report_title,
      mr.source as report_source,
      mr.report_date
    FROM document_chunks dc
    JOIN market_reports mr ON mr.id = dc.report_id
    WHERE mr.company_id = match_company_id
      AND mr.status = 'Processed'
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT 
      dc.*,
      ts_rank(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', query_text)) AS keyword_score,
      mr.title as report_title,
      mr.source as report_source,
      mr.report_date
    FROM document_chunks dc
    JOIN market_reports mr ON mr.id = dc.report_id
    WHERE mr.company_id = match_company_id
      AND mr.status = 'Processed'
      AND to_tsvector('english', dc.chunk_text) @@ plainto_tsquery('english', query_text)
    ORDER BY ts_rank(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', query_text)) DESC
    LIMIT match_count * 2
  ),
  combined_results AS (
    SELECT 
      COALESCE(vs.id, ks.id) as id,
      COALESCE(vs.chunk_text, ks.chunk_text) as chunk_text,
      COALESCE(vs.chunk_index, ks.chunk_index) as chunk_index,
      COALESCE(vs.page_number, ks.page_number) as page_number,
      COALESCE(vs.section_title, ks.section_title) as section_title,
      COALESCE(vs.word_count, ks.word_count) as word_count,
      COALESCE(vs.similarity, 0.0) as similarity,
      COALESCE(ks.keyword_score, 0.0) as keyword_score,
      (COALESCE(vs.similarity, 0.0) * 0.7 + COALESCE(ks.keyword_score, 0.0) * 0.3) as combined_score,
      COALESCE(vs.report_id, ks.report_id) as report_id,
      COALESCE(vs.report_title, ks.report_title) as report_title,
      COALESCE(vs.report_source, ks.report_source) as report_source,
      COALESCE(vs.report_date, ks.report_date) as report_date
    FROM vector_search vs
    FULL OUTER JOIN keyword_search ks ON vs.id = ks.id
  )
  SELECT * FROM combined_results
  ORDER BY combined_score DESC
  LIMIT match_count;
$$;
*/