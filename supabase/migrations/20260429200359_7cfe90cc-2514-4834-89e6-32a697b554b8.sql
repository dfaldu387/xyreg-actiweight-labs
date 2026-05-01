
ALTER TABLE public.phase_assigned_document_template
  ADD COLUMN IF NOT EXISTS language_code text,
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.phase_assigned_document_template(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_translation_per_source_lang
  ON public.phase_assigned_document_template (company_id, source_document_id, language_code)
  WHERE source_document_id IS NOT NULL AND language_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_padt_source_document_id
  ON public.phase_assigned_document_template (source_document_id)
  WHERE source_document_id IS NOT NULL;

-- Delete the older duplicate first (so unique index can be applied to backfill)
DELETE FROM public.phase_assigned_document_template
WHERE id = '9a5dcd0c-04ac-45f2-8e3d-c959fd31be48';

-- Backfill the remaining NO translation
UPDATE public.phase_assigned_document_template
SET language_code = 'NO',
    source_document_id = '357bca8d-11e4-4df9-b34a-fc2cdd56af4c'
WHERE id = '5627a68e-19d0-4497-a955-6a1a068c3ee3';
