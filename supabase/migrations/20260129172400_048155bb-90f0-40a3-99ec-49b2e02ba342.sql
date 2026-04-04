-- Add rca_methodologies array column for multi-methodology RCA support
-- Keep existing rca_methodology for backward compatibility

ALTER TABLE public.capa_records 
ADD COLUMN IF NOT EXISTS rca_methodologies text[] DEFAULT '{}';

-- Migrate existing single methodology data to array format
UPDATE public.capa_records 
SET rca_methodologies = ARRAY[rca_methodology]
WHERE rca_methodology IS NOT NULL 
  AND (rca_methodologies IS NULL OR rca_methodologies = '{}');

-- Create index for querying by methodology
CREATE INDEX IF NOT EXISTS idx_capa_records_rca_methodologies 
ON public.capa_records USING GIN (rca_methodologies);