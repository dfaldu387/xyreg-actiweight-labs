-- ============================================
-- app_notifications — future-proof notification system
-- ============================================

CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WHO receives it
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- WHO triggered it
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,

  -- SCOPE
  company_id UUID NOT NULL,
  product_id UUID,

  -- WHAT happened
  category TEXT NOT NULL DEFAULT 'general',
  action TEXT NOT NULL,

  -- DISPLAY
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',

  -- CONTEXT (what entity is this about)
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,

  -- NAVIGATION
  action_url TEXT,

  -- EXTRA DATA
  metadata JSONB DEFAULT '{}',

  -- STATE
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- TIMESTAMPS
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: user's notifications per company (main query)
CREATE INDEX idx_app_notif_user_company
  ON app_notifications (user_id, company_id, is_archived, created_at DESC);

-- Fast unread count
CREATE INDEX idx_app_notif_unread
  ON app_notifications (user_id, company_id)
  WHERE is_read = false AND is_archived = false;

-- Lookup by entity (e.g. all notifications for a document)
CREATE INDEX idx_app_notif_entity
  ON app_notifications (entity_type, entity_id);

-- RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON app_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON app_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;
