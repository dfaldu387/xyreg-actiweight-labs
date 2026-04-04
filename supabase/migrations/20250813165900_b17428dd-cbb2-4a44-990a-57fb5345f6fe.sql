-- Add all 49 EUDAMED fields to products table for comprehensive compliance tracking

-- Add all missing EUDAMED fields to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_organization text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_id_srn text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_organization_status text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_address text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_postcode text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_country text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_phone text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_email text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_website text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_first_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_last_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_email text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_phone text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_responsible_for text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_address text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_postcode text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_prrc_country text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_address text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_postcode text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_country text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_email text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ca_phone text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_applicable_legislation text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_risk_class text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_implantable text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_measuring text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_reusable text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_active text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_administering_medicine text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_issuing_agency text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_status text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_nomenclature_codes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_trade_names text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_reference_number text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_direct_marking text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_quantity_of_device integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_single_use text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_max_reuses integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_sterilization_need text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_sterile text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_contain_latex text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_reprocessed text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_placed_on_the_market text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_market_distribution text;

-- Add fields for additional EUDAMED compliance tracking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_registration_status text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_registration_date date;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_market_authorization_holder text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_notified_body text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_ce_mark_status text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS eudamed_conformity_assessment_route text;

-- Comment describing the structure
COMMENT ON COLUMN public.products.eudamed_registration_number IS 'EUDAMED Registration Number - The unique identifier assigned to the device in EUDAMED';
COMMENT ON COLUMN public.products.eudamed_organization IS 'Organization name from EUDAMED database';
COMMENT ON COLUMN public.products.eudamed_id_srn IS 'Organization ID/SRN from EUDAMED';
COMMENT ON COLUMN public.products.eudamed_organization_status IS 'Status of the organization in EUDAMED';
COMMENT ON COLUMN public.products.eudamed_prrc_first_name IS 'Person Responsible for Regulatory Compliance - First Name';
COMMENT ON COLUMN public.products.eudamed_prrc_last_name IS 'Person Responsible for Regulatory Compliance - Last Name';
COMMENT ON COLUMN public.products.eudamed_ca_name IS 'Competent Authority Name';
COMMENT ON COLUMN public.products.eudamed_applicable_legislation IS 'Applicable legislation (MDR/IVDR)';
COMMENT ON COLUMN public.products.eudamed_basic_udi_di_code IS 'Basic UDI-DI code from EUDAMED';
COMMENT ON COLUMN public.products.eudamed_nomenclature_codes IS 'EMDN nomenclature codes as JSON';