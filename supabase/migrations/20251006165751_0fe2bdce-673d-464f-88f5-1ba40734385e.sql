-- Update data_room_content table to support auto-generated content
ALTER TABLE data_room_content
  ADD COLUMN source_data_query JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN auto_refresh BOOLEAN DEFAULT true,
  ADD COLUMN generated_at TIMESTAMPTZ,
  ALTER COLUMN file_path DROP NOT NULL;

-- Add last_synced_at to data_rooms table
ALTER TABLE data_rooms
  ADD COLUMN last_synced_at TIMESTAMPTZ;

-- Create index on source_data_query for faster queries
CREATE INDEX idx_data_room_content_source_query ON data_room_content USING GIN (source_data_query);

-- Update existing records to mark them as manual uploads (not auto-generated)
UPDATE data_room_content 
SET auto_refresh = false 
WHERE file_path IS NOT NULL;