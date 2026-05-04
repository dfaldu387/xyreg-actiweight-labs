-- Training modules: lock workflow config
ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS requires_quiz boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_read_seconds integer NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS attestation_text text NOT NULL DEFAULT 'I have read and understood the contents of this document and agree to follow the procedures as written.',
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3;

-- Training records: phase tracking + read timer + signature
ALTER TABLE public.training_records
  ADD COLUMN IF NOT EXISTS read_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'not_started';

-- Validation trigger for phase value (avoiding CHECK so we can evolve)
CREATE OR REPLACE FUNCTION public.training_records_validate_phase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.phase NOT IN ('not_started','reading','quiz_ready','quiz_failed','sign_ready','completed','expired') THEN
    RAISE EXCEPTION 'Invalid training_records.phase: %', NEW.phase;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_training_records_validate_phase ON public.training_records;
CREATE TRIGGER trg_training_records_validate_phase
BEFORE INSERT OR UPDATE OF phase ON public.training_records
FOR EACH ROW EXECUTE FUNCTION public.training_records_validate_phase();

CREATE INDEX IF NOT EXISTS idx_training_records_phase ON public.training_records(phase);
CREATE INDEX IF NOT EXISTS idx_training_records_due_date ON public.training_records(due_date) WHERE phase <> 'completed';