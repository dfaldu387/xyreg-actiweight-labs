-- Ensure trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for SRN exact and fuzzy searches on the correct base table
CREATE INDEX IF NOT EXISTS idx_eudamed_medical_devices_id_srn_btree
  ON eudamed.medical_devices (id_srn);

CREATE INDEX IF NOT EXISTS idx_eudamed_medical_devices_id_srn_trgm
  ON eudamed.medical_devices USING GIN (id_srn gin_trgm_ops);
