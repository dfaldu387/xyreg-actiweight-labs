-- Enable RLS on all communication tables
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for thread_participants
CREATE POLICY "participants_select" ON thread_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM thread_participants tp2
      WHERE tp2.thread_id = thread_participants.thread_id
      AND tp2.user_id = auth.uid()
    )
  );

CREATE POLICY "participants_insert" ON thread_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communication_threads ct
      WHERE ct.id = thread_participants.thread_id
      AND ct.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "participants_update" ON thread_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for message_attachments
CREATE POLICY "attachments_select" ON message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM communication_messages cm
      JOIN thread_participants tp ON tp.thread_id = cm.thread_id
      WHERE cm.id = message_attachments.message_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_insert" ON message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communication_messages cm
      JOIN thread_participants tp ON tp.thread_id = cm.thread_id
      WHERE cm.id = message_attachments.message_id
      AND tp.user_id = auth.uid()
    )
  );