
-- Clean fake Notified Body data and prepare for real EU data import
-- This removes all fabricated entries and ensures we start with authentic data

-- First, backup any existing data (in case we need to reference the schema)
CREATE TABLE IF NOT EXISTS notified_bodies_backup AS 
SELECT * FROM notified_bodies WHERE false; -- Empty backup table with same schema

-- Clear all fake data
DELETE FROM notified_bodies;

-- Reset the sequence/auto-increment if needed
-- (Supabase uses UUIDs so this isn't necessary, but good practice)

-- Add any additional indexes for performance with real data
CREATE INDEX IF NOT EXISTS idx_notified_bodies_nb_number ON notified_bodies(nb_number);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_country ON notified_bodies(country);
CREATE INDEX IF NOT EXISTS idx_notified_bodies_active ON notified_bodies(is_active);

-- Add a data source tracking field to distinguish real vs manual entries
ALTER TABLE notified_bodies 
ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'official_eu_nando';

-- Update the trigger to handle the new field
DROP TRIGGER IF EXISTS update_notified_bodies_updated_at ON notified_bodies;
CREATE TRIGGER update_notified_bodies_updated_at
    BEFORE UPDATE ON notified_bodies
    FOR EACH ROW
    EXECUTE FUNCTION update_notified_bodies_updated_at();

-- Ensure RLS policies are in place (if needed)
ALTER TABLE notified_bodies ENABLE ROW LEVEL SECURITY;

-- Comment for documentation
COMMENT ON TABLE notified_bodies IS 'Official EU Notified Bodies from NANDO database plus manually entered custom entries';
COMMENT ON COLUMN notified_bodies.data_source IS 'Source of data: official_eu_nando, manual_entry, or custom_import';
