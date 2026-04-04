-- Add problem complexity and RCA recommendation tracking columns to capa_records
ALTER TABLE public.capa_records 
ADD COLUMN IF NOT EXISTS problem_complexity TEXT;
-- Values: 'simple', 'multi', 'complex', 'recurring'

-- Track if recommendation was followed for audit trail
ALTER TABLE public.capa_records
ADD COLUMN IF NOT EXISTS rca_recommendation_followed BOOLEAN;

-- Justification if recommendation not followed
ALTER TABLE public.capa_records
ADD COLUMN IF NOT EXISTS rca_override_reason TEXT;

COMMENT ON COLUMN public.capa_records.problem_complexity IS 'Problem classification for RCA guidance: simple (linear), multi (multiple variables), complex (system failure), recurring (pattern)';
COMMENT ON COLUMN public.capa_records.rca_recommendation_followed IS 'Whether user followed the Helix AI RCA method recommendation';
COMMENT ON COLUMN public.capa_records.rca_override_reason IS 'Justification if user overrode the recommended RCA methodology';