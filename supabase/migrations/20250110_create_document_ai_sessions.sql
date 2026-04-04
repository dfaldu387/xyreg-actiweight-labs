-- Create document_ai_sessions table for AI document summary feature
CREATE TABLE IF NOT EXISTS document_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('summary', 'key_points', 'chat', 'help_write')),
  query_text TEXT,
  ai_response TEXT NOT NULL,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_document_ai_sessions_document_id ON document_ai_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_ai_sessions_company_id ON document_ai_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_document_ai_sessions_user_id ON document_ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_ai_sessions_type ON document_ai_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_document_ai_sessions_created_at ON document_ai_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE document_ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company AI sessions"
ON document_ai_sessions FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create AI sessions for their companies"
ON document_ai_sessions FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own AI sessions"
ON document_ai_sessions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI sessions"
ON document_ai_sessions FOR DELETE
USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE document_ai_sessions IS 'Stores AI-generated document summaries, key points, chat history, and writing assistance sessions';
