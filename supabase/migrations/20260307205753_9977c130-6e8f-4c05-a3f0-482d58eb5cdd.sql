ALTER TABLE device_components ADD COLUMN part_number text;
ALTER TABLE device_components ADD COLUMN is_master_source boolean DEFAULT false;