-- Add rca_data JSONB field to capa_records for structured RCA analysis storage
ALTER TABLE capa_records 
ADD COLUMN IF NOT EXISTS rca_data JSONB DEFAULT NULL;

COMMENT ON COLUMN capa_records.rca_data IS 
'Structured RCA analysis data (fishbone categories, 5-whys chain, etc.)';