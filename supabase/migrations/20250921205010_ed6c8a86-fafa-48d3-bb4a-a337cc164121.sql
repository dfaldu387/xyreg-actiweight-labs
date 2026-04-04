-- Enhance market_reports table with AI analysis fields
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS executive_summary TEXT;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS key_findings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS strategic_recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS market_size_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS processing_error TEXT;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE market_reports ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;

-- Create document_chunks table for vector search
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES market_reports(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  section_title TEXT,
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_chunk_per_report UNIQUE(report_id, chunk_index)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_chunks_report_id ON document_chunks(report_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_market_reports_status ON market_reports(status);
CREATE INDEX IF NOT EXISTS idx_market_reports_processing ON market_reports(processing_started_at, processing_completed_at);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_chunks
CREATE POLICY "Users can view document chunks for their company reports"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM market_reports mr 
      JOIN user_company_access uca ON uca.company_id = mr.company_id
      WHERE mr.id = document_chunks.report_id 
      AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage document chunks"
  ON document_chunks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to trigger document processing
CREATE OR REPLACE FUNCTION trigger_document_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger processing if status changed to 'Uploaded'
  IF NEW.status = 'Uploaded' AND (OLD.status IS NULL OR OLD.status != 'Uploaded') THEN
    -- Update processing timestamp
    NEW.processing_started_at = now();
    
    -- Call the edge function asynchronously (this will be implemented in the edge function)
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-market-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('report_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on market_reports table
DROP TRIGGER IF EXISTS trigger_process_market_report ON market_reports;
CREATE TRIGGER trigger_process_market_report
  BEFORE UPDATE ON market_reports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_document_processing();