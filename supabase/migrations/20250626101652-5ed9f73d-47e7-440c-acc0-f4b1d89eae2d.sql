
-- Add production/manufacturing site fields to companies table
ALTER TABLE companies 
ADD COLUMN production_site_name text,
ADD COLUMN production_site_address text,
ADD COLUMN production_site_city text,
ADD COLUMN production_site_postal_code text,
ADD COLUMN production_site_country text;

-- Add a comment to document the purpose
COMMENT ON COLUMN companies.production_site_name IS 'Name of the production/manufacturing site';
COMMENT ON COLUMN companies.production_site_address IS 'Address of the production/manufacturing site';
COMMENT ON COLUMN companies.production_site_city IS 'City of the production/manufacturing site';
COMMENT ON COLUMN companies.production_site_postal_code IS 'Postal code of the production/manufacturing site';
COMMENT ON COLUMN companies.production_site_country IS 'Country of the production/manufacturing site';
