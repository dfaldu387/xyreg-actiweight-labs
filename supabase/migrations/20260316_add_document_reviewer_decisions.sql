-- Individual reviewer decisions per document
-- Tracks each reviewer's individual approve/reject/changes_requested decision
-- separate from the group-level assignment status

CREATE TABLE IF NOT EXISTS document_reviewer_decisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id text NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewer_group_id uuid REFERENCES reviewer_groups(id),
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested', 'abstain', 'in_review', 'not_started', 'pending')),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviewer_decisions_doc ON document_reviewer_decisions(document_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_decisions_reviewer ON document_reviewer_decisions(reviewer_id);

-- Unique per reviewer per document (one decision per reviewer per doc)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviewer_decisions_unique
  ON document_reviewer_decisions(document_id, reviewer_id);

-- Enable RLS
ALTER TABLE document_reviewer_decisions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write
CREATE POLICY "Authenticated users can read decisions" ON document_reviewer_decisions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert decisions" ON document_reviewer_decisions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update own decisions" ON document_reviewer_decisions
  FOR UPDATE TO authenticated USING (true);
