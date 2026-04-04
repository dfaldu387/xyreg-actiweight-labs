CREATE TABLE public.slack_sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, channel_id)
);

ALTER TABLE public.slack_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync state for their company"
  ON public.slack_sync_state FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage sync state"
  ON public.slack_sync_state FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);