-- Add translation sync timestamp to track when a translated document was last in sync with its source.
ALTER TABLE public.phase_assigned_document_template
ADD COLUMN IF NOT EXISTS translation_synced_at timestamptz;

-- Backfill: assume existing translations are currently in sync.
UPDATE public.phase_assigned_document_template
SET translation_synced_at = COALESCE(updated_at, now())
WHERE language_code IS NOT NULL
  AND source_document_id IS NOT NULL
  AND translation_synced_at IS NULL;

-- Helpful index for staleness queries.
CREATE INDEX IF NOT EXISTS idx_padt_source_document_id
  ON public.phase_assigned_document_template(source_document_id)
  WHERE source_document_id IS NOT NULL;