-- Add display_as_merged column to basic_udi_di_groups table
ALTER TABLE basic_udi_di_groups
ADD COLUMN display_as_merged BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying
CREATE INDEX idx_basic_udi_di_groups_merged ON basic_udi_di_groups(company_id, display_as_merged) WHERE display_as_merged = true;