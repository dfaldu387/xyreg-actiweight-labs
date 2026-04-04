-- Extend document_annotations table for market intelligence reports
ALTER TABLE document_annotations 
ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES market_reports(id) ON DELETE CASCADE;

-- Create index for efficient report annotation retrieval
CREATE INDEX IF NOT EXISTS idx_document_annotations_report_id ON document_annotations(report_id);

-- Create table for report chat sessions (Ask This Document)
CREATE TABLE IF NOT EXISTS report_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES market_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  response_sources JSONB DEFAULT '[]'::jsonb, -- Array of chunk references with page numbers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on report_chat_sessions
ALTER TABLE report_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_chat_sessions
CREATE POLICY "Users can view their company's report chat sessions"
ON report_chat_sessions
FOR SELECT
USING (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
));

CREATE POLICY "Users can create report chat sessions for their companies"
ON report_chat_sessions
FOR INSERT
WITH CHECK (company_id IN (
  SELECT user_company_access.company_id
  FROM user_company_access
  WHERE user_company_access.user_id = auth.uid()
    AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'viewer'::user_role_type])
));

-- Create RLS policy for report-specific annotations
CREATE POLICY "Users can view report annotations for their companies"
ON document_annotations
FOR SELECT
USING (
  report_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM market_reports mr
    WHERE mr.id = document_annotations.report_id
      AND mr.company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users can create report annotations for their companies"
ON document_annotations
FOR INSERT
WITH CHECK (
  report_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM market_reports mr
    WHERE mr.id = document_annotations.report_id
      AND mr.company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid()
          AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'viewer'::user_role_type])
      )
  )
);

CREATE POLICY "Users can update their own report annotations"
ON document_annotations
FOR UPDATE
USING (
  report_id IS NOT NULL 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM market_reports mr
    WHERE mr.id = document_annotations.report_id
      AND mr.company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users can delete their own report annotations"
ON document_annotations
FOR DELETE
USING (
  report_id IS NOT NULL 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM market_reports mr
    WHERE mr.id = document_annotations.report_id
      AND mr.company_id IN (
        SELECT user_company_access.company_id
        FROM user_company_access
        WHERE user_company_access.user_id = auth.uid()
      )
  )
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_report_chat_sessions_report_id ON report_chat_sessions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_chat_sessions_user_id ON report_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_chat_sessions_company_id ON report_chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_report_chat_sessions_created_at ON report_chat_sessions(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_report_chat_sessions_updated_at
  BEFORE UPDATE ON report_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();