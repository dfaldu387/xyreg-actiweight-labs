-- Create the hybrid search function for document chunks
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
LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp
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