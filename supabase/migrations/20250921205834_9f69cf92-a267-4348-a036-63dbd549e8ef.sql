-- Create search optimization indexes for document_chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts ON document_chunks USING GIN (to_tsvector('english', chunk_text));
CREATE INDEX IF NOT EXISTS idx_document_chunks_company_filter ON document_chunks(report_id);

-- Create search_queries table for search history
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  query_text TEXT NOT NULL,
  ai_response TEXT,
  source_chunks JSONB DEFAULT '[]'::jsonb,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_company_user ON search_queries(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);

-- Enable RLS on search_queries
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_queries
CREATE POLICY "Users can view their own search queries"
  ON search_queries FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can create their own search queries"
  ON search_queries FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own search queries"
  ON search_queries FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own search queries"
  ON search_queries FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_company_access 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );