-- Fix thread_participants SELECT to allow viewing all participants in threads you belong to
DROP POLICY IF EXISTS "participants_select" ON public.thread_participants;

CREATE POLICY "participants_select" ON public.thread_participants
  FOR SELECT USING (
    public.is_thread_participant(auth.uid(), thread_id)
  );

-- Also add message_attachments policies if missing
DROP POLICY IF EXISTS "attachments_select" ON public.message_attachments;
DROP POLICY IF EXISTS "attachments_insert" ON public.message_attachments;

CREATE POLICY "attachments_select" ON public.message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communication_messages cm
      WHERE cm.id = message_attachments.message_id
      AND public.is_thread_participant(auth.uid(), cm.thread_id)
    )
  );

CREATE POLICY "attachments_insert" ON public.message_attachments
  FOR INSERT WITH CHECK (true);