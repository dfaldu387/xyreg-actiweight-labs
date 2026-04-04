-- Module group validation records (IQ/OQ/PQ per module per company per release)
-- Implements TR 80002-2 §5.3.3.5 Validation Report persistence

CREATE TABLE public.module_group_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  release_id uuid REFERENCES public.xyreg_releases(id) ON DELETE SET NULL,
  module_group_id text NOT NULL,
  release_version text,

  -- IQ fields
  iq_verdict text CHECK (iq_verdict IN ('acceptable','acceptable_with_observations','not_acceptable','not_applicable','deferred','')),
  iq_reasoning text,
  iq_evidence_notes text,
  iq_evidence_doc_ids uuid[],
  iq_test_environment jsonb DEFAULT '{}',
  iq_test_step_results jsonb DEFAULT '[]',
  iq_signatures jsonb DEFAULT '{}',

  -- OQ fields
  oq_verdict text CHECK (oq_verdict IN ('acceptable','acceptable_with_observations','not_acceptable','not_applicable','deferred','')),
  oq_reasoning text,
  oq_deviations_noted text,
  oq_risk_accepted boolean,
  oq_risk_rationale text,
  oq_evidence_doc_ids uuid[],
  oq_test_environment jsonb DEFAULT '{}',
  oq_test_step_results jsonb DEFAULT '[]',
  oq_signatures jsonb DEFAULT '{}',

  -- PQ fields
  pq_verdict text CHECK (pq_verdict IN ('acceptable','acceptable_with_observations','not_acceptable','not_applicable','deferred','')),
  pq_reasoning text,
  pq_evidence_notes text,
  pq_evidence_doc_ids uuid[],
  pq_test_environment jsonb DEFAULT '{}',
  pq_test_step_results jsonb DEFAULT '[]',
  pq_signatures jsonb DEFAULT '{}',

  -- Overall determination
  overall_verdict text CHECK (overall_verdict IN ('validated','validated_with_conditions','not_validated','not_applicable','')),
  overall_rationale text,
  conditions text,

  -- Meta
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  invalidated_by_core boolean DEFAULT false,
  invalidated_service text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, release_id, module_group_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_mgv_company_release
  ON public.module_group_validations(company_id, release_id);
CREATE INDEX idx_mgv_company_module
  ON public.module_group_validations(company_id, module_group_id);
CREATE INDEX idx_mgv_overall_verdict
  ON public.module_group_validations(overall_verdict) WHERE overall_verdict IS NOT NULL;

ALTER TABLE public.module_group_validations ENABLE ROW LEVEL SECURITY;

-- Simple full-access policy for all authenticated users (select/insert/update/delete)
CREATE POLICY "Authenticated users full access"
  ON public.module_group_validations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_module_group_validation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_module_group_validation_updated
  BEFORE UPDATE ON public.module_group_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_module_group_validation_timestamp();
