
-- Advisory conversations (thread metadata)
CREATE TABLE public.advisory_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL DEFAULT 'professor-xyreg',
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Advisory messages (individual chat messages)
CREATE TABLE public.advisory_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.advisory_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_advisory_conversations_user ON public.advisory_conversations(user_id, company_id);
CREATE INDEX idx_advisory_messages_conversation ON public.advisory_messages(conversation_id);

-- RLS
ALTER TABLE public.advisory_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users see only their own within their company
CREATE POLICY "Users manage own advisory conversations"
  ON public.advisory_conversations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Messages: users can access messages belonging to their conversations
CREATE POLICY "Users manage own advisory messages"
  ON public.advisory_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.advisory_conversations
      WHERE id = advisory_messages.conversation_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advisory_conversations
      WHERE id = advisory_messages.conversation_id
      AND user_id = auth.uid()
    )
  );
