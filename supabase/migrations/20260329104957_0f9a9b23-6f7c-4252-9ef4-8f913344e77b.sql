
-- Add signature columns to customer_validation_records for IQ/OQ/PQ phases
ALTER TABLE customer_validation_records
  ADD COLUMN IF NOT EXISTS iq_initiator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS iq_initiator_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS iq_initiator_meaning text,
  ADD COLUMN IF NOT EXISTS iq_approver_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS iq_approver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS iq_approver_meaning text,
  ADD COLUMN IF NOT EXISTS oq_initiator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS oq_initiator_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS oq_initiator_meaning text,
  ADD COLUMN IF NOT EXISTS oq_approver_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS oq_approver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS oq_approver_meaning text,
  ADD COLUMN IF NOT EXISTS pq_initiator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pq_initiator_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pq_initiator_meaning text,
  ADD COLUMN IF NOT EXISTS pq_approver_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS pq_approver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS pq_approver_meaning text;

-- Separation of duties trigger: approver cannot be the same as initiator
CREATE OR REPLACE FUNCTION check_validation_separation_of_duties()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.iq_approver_id IS NOT NULL AND NEW.iq_initiator_id IS NOT NULL AND NEW.iq_approver_id = NEW.iq_initiator_id THEN
    RAISE EXCEPTION 'IQ Approver cannot be the same as IQ Initiator (Separation of Duties)';
  END IF;
  IF NEW.oq_approver_id IS NOT NULL AND NEW.oq_initiator_id IS NOT NULL AND NEW.oq_approver_id = NEW.oq_initiator_id THEN
    RAISE EXCEPTION 'OQ Approver cannot be the same as OQ Initiator (Separation of Duties)';
  END IF;
  IF NEW.pq_approver_id IS NOT NULL AND NEW.pq_initiator_id IS NOT NULL AND NEW.pq_approver_id = NEW.pq_initiator_id THEN
    RAISE EXCEPTION 'PQ Approver cannot be the same as PQ Initiator (Separation of Duties)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validation_separation_of_duties ON customer_validation_records;
CREATE TRIGGER trg_validation_separation_of_duties
  BEFORE INSERT OR UPDATE ON customer_validation_records
  FOR EACH ROW
  EXECUTE FUNCTION check_validation_separation_of_duties();
