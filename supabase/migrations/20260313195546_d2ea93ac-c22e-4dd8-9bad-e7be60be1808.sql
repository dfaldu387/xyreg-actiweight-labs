CREATE TABLE public.slack_knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_date date,
  channel_name text,
  cluster text,
  raw_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_text text NOT NULL DEFAULT '',
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slack_knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read entries for their companies"
  ON public.slack_knowledge_entries FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert entries for their companies"
  ON public.slack_knowledge_entries FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    company_id IN (
      SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update entries for their companies"
  ON public.slack_knowledge_entries FOR UPDATE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete entries for their companies"
  ON public.slack_knowledge_entries FOR DELETE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE TABLE public.slack_knowledge_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  ai_response text NOT NULL DEFAULT '',
  cluster_filter text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slack_knowledge_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chats"
  ON public.slack_knowledge_chats FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chats"
  ON public.slack_knowledge_chats FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_slack_knowledge_entries_company ON public.slack_knowledge_entries(company_id);
CREATE INDEX idx_slack_knowledge_entries_cluster ON public.slack_knowledge_entries(cluster);
CREATE INDEX idx_slack_knowledge_chats_company ON public.slack_knowledge_chats(company_id);
CREATE INDEX idx_slack_knowledge_chats_user ON public.slack_knowledge_chats(user_id);