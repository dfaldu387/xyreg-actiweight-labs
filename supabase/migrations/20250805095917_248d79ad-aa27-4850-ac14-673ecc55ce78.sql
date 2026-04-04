-- Drop and recreate eudamed_device_registry table with proper field constraints
-- This will clear all corrupted data and prevent future CSV parsing issues

DROP TABLE IF EXISTS public.eudamed_device_registry CASCADE;

CREATE TABLE public.eudamed_device_registry (
    id_srn VARCHAR(50) PRIMARY KEY,
    udi_di VARCHAR(100),
    organization VARCHAR(300),
    organization_status VARCHAR(50),
    address VARCHAR(500),
    postcode VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(200),
    prrc_first_name VARCHAR(100),
    prrc_last_name VARCHAR(100),
    prrc_email VARCHAR(100),
    prrc_phone VARCHAR(50),
    prrc_responsible_for VARCHAR(200),
    prrc_address VARCHAR(500),
    prrc_postcode VARCHAR(20),
    prrc_country VARCHAR(100),
    ca_name VARCHAR(300),
    ca_address VARCHAR(500),
    ca_postcode VARCHAR(20),
    ca_country VARCHAR(100),
    ca_email VARCHAR(100),
    ca_phone VARCHAR(50),
    applicable_legislation VARCHAR(100),
    basic_udi_di_code VARCHAR(100),
    risk_class VARCHAR(20),
    implantable VARCHAR(10),
    measuring VARCHAR(10),
    reusable VARCHAR(10),
    active VARCHAR(10),
    administering_medicine VARCHAR(10),
    device_model VARCHAR(500),
    device_name VARCHAR(1000),
    issuing_agency VARCHAR(100),
    status VARCHAR(50),
    nomenclature_codes VARCHAR(2000),
    trade_names VARCHAR(1000),
    reference_number VARCHAR(100),
    direct_marking VARCHAR(10),
    quantity_of_device VARCHAR(100),
    single_use VARCHAR(10),
    max_reuses VARCHAR(50),
    sterilization_need VARCHAR(10),
    sterile VARCHAR(10),
    contain_latex VARCHAR(10),
    reprocessed VARCHAR(10),
    placed_on_the_market VARCHAR(50),
    market_distribution VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_eudamed_device_name ON public.eudamed_device_registry(device_name);
CREATE INDEX idx_eudamed_organization ON public.eudamed_device_registry(organization);
CREATE INDEX idx_eudamed_device_model ON public.eudamed_device_registry(device_model);
CREATE INDEX idx_eudamed_risk_class ON public.eudamed_device_registry(risk_class);
CREATE INDEX idx_eudamed_country ON public.eudamed_device_registry(country);

-- Enable RLS (if needed for security)
ALTER TABLE public.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access (adjust as needed)
CREATE POLICY "Allow public read access to EUDAMED data" ON public.eudamed_device_registry
FOR SELECT USING (true);