-- Create docx_comments table for storing OnlyOffice document comments version-wise
CREATE TABLE IF NOT EXISTS public.docx_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  docx_comment_id TEXT NOT NULL,
  author TEXT,
  author_initials TEXT,
  comment_date TIMESTAMP WITH TIME ZONE,
  content TEXT NOT NULL,
  quoted_text TEXT,
  parent_comment_docx_id TEXT,
  is_resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_docx_comments_document_id ON public.docx_comments(document_id);
CREATE INDEX idx_docx_comments_document_version ON public.docx_comments(document_id, version);
CREATE UNIQUE INDEX idx_docx_comments_unique ON public.docx_comments(document_id, version, docx_comment_id);

-- Enable RLS
ALTER TABLE public.docx_comments ENABLE ROW LEVEL SECURITY;

-- RLS policy: authenticated users can read comments
-- (Service role key used by edge function bypasses RLS for inserts)
CREATE POLICY "Authenticated users can view docx comments"
ON public.docx_comments
FOR SELECT
TO authenticated
USING (true);

-- Updated_at trigger
CREATE OR REPLACE TRIGGER update_docx_comments_updated_at
  BEFORE UPDATE ON public.docx_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
