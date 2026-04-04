-- Speed up SRN lookups that are timing out
-- Enable trigram extension for fast ILIKE searches (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Exact match index for id_srn (eq filter)
CREATE INDEX IF NOT EXISTS idx_eudamed_medical_devices_id_srn
  ON public.eudamed_medical_devices (id_srn);

-- Trigram index for partial searches using ILIKE
CREATE INDEX IF NOT EXISTS idx_eudamed_medical_devices_id_srn_trgm
  ON public.eudamed_medical_devices USING GIN (id_srn gin_trgm_ops);
