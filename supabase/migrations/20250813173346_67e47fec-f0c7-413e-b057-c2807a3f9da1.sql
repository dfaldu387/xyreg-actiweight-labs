-- Add all 49 EUDAMED fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS eudamed_organization text,
ADD COLUMN IF NOT EXISTS eudamed_id_srn text,
ADD COLUMN IF NOT EXISTS eudamed_organization_status text,
ADD COLUMN IF NOT EXISTS eudamed_address text,
ADD COLUMN IF NOT EXISTS eudamed_postcode text,
ADD COLUMN IF NOT EXISTS eudamed_country text,
ADD COLUMN IF NOT EXISTS eudamed_phone text,
ADD COLUMN IF NOT EXISTS eudamed_email text,
ADD COLUMN IF NOT EXISTS eudamed_website text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_first_name text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_last_name text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_email text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_phone text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_responsible_for text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_address text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_postcode text,
ADD COLUMN IF NOT EXISTS eudamed_prrc_country text,
ADD COLUMN IF NOT EXISTS eudamed_ca_name text,
ADD COLUMN IF NOT EXISTS eudamed_ca_address text,
ADD COLUMN IF NOT EXISTS eudamed_ca_postcode text,
ADD COLUMN IF NOT EXISTS eudamed_ca_country text,
ADD COLUMN IF NOT EXISTS eudamed_ca_email text,
ADD COLUMN IF NOT EXISTS eudamed_ca_phone text,
ADD COLUMN IF NOT EXISTS eudamed_applicable_legislation text,
ADD COLUMN IF NOT EXISTS eudamed_basic_udi_di_code text,
ADD COLUMN IF NOT EXISTS eudamed_risk_class text,
ADD COLUMN IF NOT EXISTS eudamed_implantable boolean,
ADD COLUMN IF NOT EXISTS eudamed_measuring boolean,
ADD COLUMN IF NOT EXISTS eudamed_reusable boolean,
ADD COLUMN IF NOT EXISTS eudamed_active boolean,
ADD COLUMN IF NOT EXISTS eudamed_administering_medicine boolean,
ADD COLUMN IF NOT EXISTS eudamed_device_model text,
ADD COLUMN IF NOT EXISTS eudamed_device_name text,
ADD COLUMN IF NOT EXISTS eudamed_issuing_agency text,
ADD COLUMN IF NOT EXISTS eudamed_status text,
ADD COLUMN IF NOT EXISTS eudamed_nomenclature_codes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS eudamed_trade_names text,
ADD COLUMN IF NOT EXISTS eudamed_reference_number text,
ADD COLUMN IF NOT EXISTS eudamed_direct_marking boolean,
ADD COLUMN IF NOT EXISTS eudamed_quantity_of_device text,
ADD COLUMN IF NOT EXISTS eudamed_single_use boolean,
ADD COLUMN IF NOT EXISTS eudamed_max_reuses integer,
ADD COLUMN IF NOT EXISTS eudamed_sterilization_need boolean,
ADD COLUMN IF NOT EXISTS eudamed_sterile boolean,
ADD COLUMN IF NOT EXISTS eudamed_contain_latex boolean,
ADD COLUMN IF NOT EXISTS eudamed_reprocessed boolean,
ADD COLUMN IF NOT EXISTS eudamed_placed_on_the_market date,
ADD COLUMN IF NOT EXISTS eudamed_market_distribution text;

-- Create an index on eudamed_id_srn for better performance
CREATE INDEX IF NOT EXISTS idx_products_eudamed_id_srn ON products(eudamed_id_srn);

-- Create an index on eudamed_organization for better performance  
CREATE INDEX IF NOT EXISTS idx_products_eudamed_organization ON products(eudamed_organization);

COMMENT ON COLUMN products.eudamed_organization IS 'EUDAMED Organization name';
COMMENT ON COLUMN products.eudamed_id_srn IS 'EUDAMED ID/SRN identifier';
COMMENT ON COLUMN products.eudamed_organization_status IS 'EUDAMED Organization status';
COMMENT ON COLUMN products.eudamed_address IS 'EUDAMED Organization address';
COMMENT ON COLUMN products.eudamed_postcode IS 'EUDAMED Organization postcode';
COMMENT ON COLUMN products.eudamed_country IS 'EUDAMED Organization country';
COMMENT ON COLUMN products.eudamed_phone IS 'EUDAMED Organization phone';
COMMENT ON COLUMN products.eudamed_email IS 'EUDAMED Organization email';
COMMENT ON COLUMN products.eudamed_website IS 'EUDAMED Organization website';
COMMENT ON COLUMN products.eudamed_prrc_first_name IS 'EUDAMED PRRC first name';
COMMENT ON COLUMN products.eudamed_prrc_last_name IS 'EUDAMED PRRC last name';
COMMENT ON COLUMN products.eudamed_prrc_email IS 'EUDAMED PRRC email';
COMMENT ON COLUMN products.eudamed_prrc_phone IS 'EUDAMED PRRC phone';
COMMENT ON COLUMN products.eudamed_prrc_responsible_for IS 'EUDAMED PRRC responsible for';
COMMENT ON COLUMN products.eudamed_prrc_address IS 'EUDAMED PRRC address';
COMMENT ON COLUMN products.eudamed_prrc_postcode IS 'EUDAMED PRRC postcode';
COMMENT ON COLUMN products.eudamed_prrc_country IS 'EUDAMED PRRC country';
COMMENT ON COLUMN products.eudamed_ca_name IS 'EUDAMED CA name';
COMMENT ON COLUMN products.eudamed_ca_address IS 'EUDAMED CA address';
COMMENT ON COLUMN products.eudamed_ca_postcode IS 'EUDAMED CA postcode';
COMMENT ON COLUMN products.eudamed_ca_country IS 'EUDAMED CA country';
COMMENT ON COLUMN products.eudamed_ca_email IS 'EUDAMED CA email';
COMMENT ON COLUMN products.eudamed_ca_phone IS 'EUDAMED CA phone';
COMMENT ON COLUMN products.eudamed_applicable_legislation IS 'EUDAMED applicable legislation';
COMMENT ON COLUMN products.eudamed_basic_udi_di_code IS 'EUDAMED Basic UDI-DI code';
COMMENT ON COLUMN products.eudamed_risk_class IS 'EUDAMED risk class';
COMMENT ON COLUMN products.eudamed_implantable IS 'EUDAMED implantable flag';
COMMENT ON COLUMN products.eudamed_measuring IS 'EUDAMED measuring flag';
COMMENT ON COLUMN products.eudamed_reusable IS 'EUDAMED reusable flag';
COMMENT ON COLUMN products.eudamed_active IS 'EUDAMED active flag';
COMMENT ON COLUMN products.eudamed_administering_medicine IS 'EUDAMED administering medicine flag';
COMMENT ON COLUMN products.eudamed_device_model IS 'EUDAMED device model';
COMMENT ON COLUMN products.eudamed_device_name IS 'EUDAMED device name';
COMMENT ON COLUMN products.eudamed_issuing_agency IS 'EUDAMED issuing agency';
COMMENT ON COLUMN products.eudamed_status IS 'EUDAMED status';
COMMENT ON COLUMN products.eudamed_nomenclature_codes IS 'EUDAMED nomenclature codes array';
COMMENT ON COLUMN products.eudamed_trade_names IS 'EUDAMED trade names';
COMMENT ON COLUMN products.eudamed_reference_number IS 'EUDAMED reference number';
COMMENT ON COLUMN products.eudamed_direct_marking IS 'EUDAMED direct marking flag';
COMMENT ON COLUMN products.eudamed_quantity_of_device IS 'EUDAMED quantity of device';
COMMENT ON COLUMN products.eudamed_single_use IS 'EUDAMED single use flag';
COMMENT ON COLUMN products.eudamed_max_reuses IS 'EUDAMED maximum reuses';
COMMENT ON COLUMN products.eudamed_sterilization_need IS 'EUDAMED sterilization need flag';
COMMENT ON COLUMN products.eudamed_sterile IS 'EUDAMED sterile flag';
COMMENT ON COLUMN products.eudamed_contain_latex IS 'EUDAMED contain latex flag';
COMMENT ON COLUMN products.eudamed_reprocessed IS 'EUDAMED reprocessed flag';
COMMENT ON COLUMN products.eudamed_placed_on_the_market IS 'EUDAMED placed on the market date';
COMMENT ON COLUMN products.eudamed_market_distribution IS 'EUDAMED market distribution';