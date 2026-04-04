-- ============================================
-- action_item_dismissals — per-user "Done" tracking for Mission Control action items
-- ============================================

CREATE TABLE IF NOT EXISTS action_item_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_item_id TEXT NOT NULL,
  company_id UUID NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_item_id)
);

-- Fast lookup: user's dismissed items per company
CREATE INDEX idx_action_dismissals_user
  ON action_item_dismissals (user_id, company_id);

-- RLS
ALTER TABLE action_item_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON action_item_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON action_item_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON action_item_dismissals FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE action_item_dismissals;
