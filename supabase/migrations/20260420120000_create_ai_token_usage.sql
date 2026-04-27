-- Per-request AI token usage tracking table
CREATE TABLE public.ai_token_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,                    -- 'professor_xyreg', 'document_ai_assistant', etc.
  model TEXT NOT NULL,                     -- 'gemini-2.5-flash', etc.
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  thinking_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,      -- agentId, documentName, documentType, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_token_usage_company_id ON public.ai_token_usage(company_id);
CREATE INDEX idx_ai_token_usage_company_created ON public.ai_token_usage(company_id, created_at DESC);
CREATE INDEX idx_ai_token_usage_source ON public.ai_token_usage(source);

ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Read-only for company members (same pattern as company_api_keys)
CREATE POLICY "Users can view token usage for accessible companies"
  ON public.ai_token_usage FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));
