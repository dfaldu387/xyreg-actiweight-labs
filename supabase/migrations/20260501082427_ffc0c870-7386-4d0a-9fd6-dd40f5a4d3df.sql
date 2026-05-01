ALTER TABLE public.fpd_sop_catalog
  ADD COLUMN IF NOT EXISTS default_sections jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.fpd_sop_catalog.default_sections IS
  'Editable per-section template body: [{id, title, content}]. Empty array means fall back to the hardcoded SOP_FULL_CONTENT library.';