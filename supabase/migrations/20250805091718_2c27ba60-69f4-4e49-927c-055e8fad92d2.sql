-- Add character limits to problematic EUDAMED fields to prevent btree index issues
-- This will truncate existing data that exceeds the limits and prevent future issues

-- First, update existing data that exceeds the new limits
UPDATE eudamed_device_registry 
SET 
  device_name = LEFT(device_name, 1000),
  device_model = LEFT(device_model, 500),
  organization = LEFT(organization, 300),
  trade_names = LEFT(trade_names, 1000),
  authorized_representative_address = LEFT(authorized_representative_address, 500),
  manufacturer_address = LEFT(manufacturer_address, 500),
  notified_body_name = LEFT(notified_body_name, 300),
  notified_body_address = LEFT(notified_body_address, 500)
WHERE 
  LENGTH(device_name) > 1000 OR
  LENGTH(device_model) > 500 OR
  LENGTH(organization) > 300 OR
  LENGTH(trade_names) > 1000 OR
  LENGTH(authorized_representative_address) > 500 OR
  LENGTH(manufacturer_address) > 500 OR
  LENGTH(notified_body_name) > 300 OR
  LENGTH(notified_body_address) > 500;

-- Now alter the table to add the character limits
ALTER TABLE eudamed_device_registry 
  ALTER COLUMN device_name TYPE VARCHAR(1000),
  ALTER COLUMN device_model TYPE VARCHAR(500),
  ALTER COLUMN organization TYPE VARCHAR(300),
  ALTER COLUMN trade_names TYPE VARCHAR(1000),
  ALTER COLUMN authorized_representative_address TYPE VARCHAR(500),
  ALTER COLUMN manufacturer_address TYPE VARCHAR(500),
  ALTER COLUMN notified_body_name TYPE VARCHAR(300),
  ALTER COLUMN notified_body_address TYPE VARCHAR(500);

-- Recreate the device_name index now that field length is limited
CREATE INDEX IF NOT EXISTS idx_eudamed_device_name_limited ON eudamed_device_registry USING btree (device_name);

-- Add indexes for other commonly searched fields
CREATE INDEX IF NOT EXISTS idx_eudamed_organization ON eudamed_device_registry USING btree (organization);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_model ON eudamed_device_registry USING btree (device_model);