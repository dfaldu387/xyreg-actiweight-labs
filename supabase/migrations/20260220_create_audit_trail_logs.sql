-- 21 CFR Part 11 Audit Trail: General-purpose audit log table
-- Covers: User Access & Security, Quality Processes, E-Signatures, and overflow from document/product logs

CREATE TABLE IF NOT EXISTS public.audit_trail_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('document_record','e_signature','user_access_security','quality_process')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  reason TEXT,
  changes JSONB DEFAULT '[]'::jsonb,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_atl_company ON public.audit_trail_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_atl_category ON public.audit_trail_logs(category);
CREATE INDEX IF NOT EXISTS idx_atl_user ON public.audit_trail_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_atl_created ON public.audit_trail_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atl_action ON public.audit_trail_logs(action);
CREATE INDEX IF NOT EXISTS idx_atl_entity_type ON public.audit_trail_logs(entity_type);

-- RLS
ALTER TABLE public.audit_trail_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all company logs
CREATE POLICY "Company admins can read audit trail"
  ON public.audit_trail_logs FOR SELECT
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca
      WHERE uca.user_id = auth.uid() AND uca.access_level = 'admin'
    )
    OR user_id = auth.uid()
  );

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert audit trail"
  ON public.audit_trail_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add reason column to existing audit tables
ALTER TABLE public.document_audit_logs ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.product_audit_logs ADD COLUMN IF NOT EXISTS reason TEXT;
