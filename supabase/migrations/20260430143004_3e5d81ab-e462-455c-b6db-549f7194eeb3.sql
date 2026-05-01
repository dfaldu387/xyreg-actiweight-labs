ALTER TABLE phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'EN',
  ADD COLUMN IF NOT EXISTS ai_translated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS derived_from_ci_id uuid,
  ADD COLUMN IF NOT EXISTS derivation_type text,
  ADD COLUMN IF NOT EXISTS language_variants jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS derived_work_instructions uuid[] DEFAULT ARRAY[]::uuid[];

CREATE INDEX IF NOT EXISTS idx_pad_derived_from ON phase_assigned_document_template(derived_from_ci_id);
CREATE INDEX IF NOT EXISTS idx_pad_language ON phase_assigned_document_template(language);