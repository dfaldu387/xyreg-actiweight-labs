
-- Create document highlights table for text selection and highlighting
CREATE TABLE IF NOT EXISTS document_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  color VARCHAR(7) DEFAULT '#ffff00',
  page_number INTEGER DEFAULT 1,
  position JSONB,
  reviewer_group_id UUID REFERENCES reviewer_groups(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enhanced review decisions table
CREATE TABLE IF NOT EXISTS review_decisions_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES review_workflows(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  decision_type VARCHAR(20) CHECK (decision_type IN ('approved', 'rejected', 'changes_requested')) NOT NULL,
  decision_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT true
);

-- Add document status tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'not_started';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_review_action TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_deadline DATE;

-- Add comment status and type enhancements
ALTER TABLE comments ADD COLUMN IF NOT EXISTS comment_status VARCHAR(20) DEFAULT 'open' CHECK (comment_status IN ('open', 'resolved', 'pending'));
ALTER TABLE comments ADD COLUMN IF NOT EXISTS comment_priority VARCHAR(10) DEFAULT 'normal' CHECK (comment_priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE comments ADD COLUMN IF NOT EXISTS mentioned_users UUID[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_highlights_document_id ON document_highlights(document_id);
CREATE INDEX IF NOT EXISTS idx_document_highlights_user_id ON document_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_review_decisions_enhanced_document_id ON review_decisions_enhanced(document_id);
CREATE INDEX IF NOT EXISTS idx_review_decisions_enhanced_workflow_id ON review_decisions_enhanced(workflow_id);

-- Enable RLS
ALTER TABLE document_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_decisions_enhanced ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_highlights
CREATE POLICY "Users can view highlights for documents they have access to" ON document_highlights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d 
      JOIN user_company_access uca ON uca.company_id = d.company_id 
      WHERE d.id = document_highlights.document_id 
      AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create highlights for documents they have access to" ON document_highlights
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM documents d 
      JOIN user_company_access uca ON uca.company_id = d.company_id 
      WHERE d.id = document_highlights.document_id 
      AND uca.user_id = auth.uid()
    )
  );

-- RLS policies for review_decisions_enhanced
CREATE POLICY "Users can view review decisions for documents they have access to" ON review_decisions_enhanced
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d 
      JOIN user_company_access uca ON uca.company_id = d.company_id 
      WHERE d.id = review_decisions_enhanced.document_id 
      AND uca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create review decisions for documents they have access to" ON review_decisions_enhanced
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM documents d 
      JOIN user_company_access uca ON uca.company_id = d.company_id 
      WHERE d.id = review_decisions_enhanced.document_id 
      AND uca.user_id = auth.uid()
    )
  );
