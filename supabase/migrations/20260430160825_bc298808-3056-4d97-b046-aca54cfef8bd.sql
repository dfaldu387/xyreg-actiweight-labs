
-- Global Work Instructions catalog: WIs derived from foundational (Tier-A) SOPs.
-- These are identical for every company, so generated once and referenced by all.
CREATE TABLE public.global_work_instructions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_template_key text NOT NULL,                    -- e.g. "SOP-001"
  wi_number text NOT NULL,                           -- e.g. "WI-QA-001"
  title text NOT NULL,
  scope text,
  roles text[] DEFAULT ARRAY[]::text[],
  modules text[] NOT NULL DEFAULT ARRAY[]::text[],   -- detected XyReg module keys
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,       -- studio-shaped sections
  focus text,                                        -- the task focus this WI covers
  version int NOT NULL DEFAULT 1,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sop_template_key, wi_number, version)
);

CREATE INDEX idx_global_wi_sop_key ON public.global_work_instructions (sop_template_key);

ALTER TABLE public.global_work_instructions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the global catalog.
CREATE POLICY "Authenticated users can read global WIs"
  ON public.global_work_instructions
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes are service-role only (no policy = no access for anon/authenticated).

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ SET search_path = public;

CREATE TRIGGER trg_global_wi_updated_at
  BEFORE UPDATE ON public.global_work_instructions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Track which company has materialized which global WI as a per-company CI
-- (so reopening reuses the same drawer-compatible CI instead of duplicating).
CREATE TABLE public.global_wi_company_materializations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_wi_id uuid NOT NULL REFERENCES public.global_work_instructions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  ci_id uuid NOT NULL,                               -- phase_assigned_document_template.id
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (global_wi_id, company_id)
);

CREATE INDEX idx_gwi_mat_company ON public.global_wi_company_materializations (company_id);

ALTER TABLE public.global_wi_company_materializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read materializations for their company"
  ON public.global_wi_company_materializations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert materializations"
  ON public.global_wi_company_materializations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
