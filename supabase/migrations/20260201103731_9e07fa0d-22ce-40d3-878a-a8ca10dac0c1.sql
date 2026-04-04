-- Add source_device_id and source_node_id columns for Evidence Escalation feature
-- These columns track device-level failures escalated to company-level CAPAs

ALTER TABLE public.capa_records
ADD COLUMN IF NOT EXISTS source_device_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_node_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.capa_records.source_device_id IS 'Device/Product ID when CAPA originated from device-level escalation';
COMMENT ON COLUMN public.capa_records.source_node_id IS 'QMS node ID when CAPA originated from device map escalation (e.g., vv_testing, risk_management)';

-- Create index for efficient querying of escalated CAPAs
CREATE INDEX IF NOT EXISTS idx_capa_records_source_device_id ON public.capa_records(source_device_id) WHERE source_device_id IS NOT NULL;