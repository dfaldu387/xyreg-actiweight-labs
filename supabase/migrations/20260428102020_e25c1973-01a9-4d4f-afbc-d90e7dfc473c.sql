ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS change_control_ref text;

COMMENT ON COLUMN public.phase_assigned_document_template.change_control_ref IS
  'Reference to the Change Control Request (CCR) ID that authorizes this document version. Required for revisions per ISO 13485 / 21 CFR Part 820.';