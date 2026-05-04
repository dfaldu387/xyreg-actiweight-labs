ALTER TABLE public.document_user_comments
  ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assignee_id uuid;

CREATE INDEX IF NOT EXISTS idx_document_user_comments_assignee
  ON public.document_user_comments (assignee_id)
  WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_user_comments_mentioned
  ON public.document_user_comments USING GIN (mentioned_user_ids);