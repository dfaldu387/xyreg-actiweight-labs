-- Move eudamed_device_registry table from public to eudamed schema

-- First, create the table in the eudamed schema
CREATE TABLE eudamed.eudamed_device_registry (
    -- Primary identification columns
    udi_di VARCHAR(255),
    organization VARCHAR(500),
    id_srn VARCHAR(100) PRIMARY KEY,
    organization_status VARCHAR(100),
    
    -- Organization address information
    address VARCHAR(500),
    postcode VARCHAR(50),
    country VARCHAR(100),
    phone VARCHAR(100),
    email VARCHAR(255),
    website VARCHAR(500),
    
    -- PRRC (Person Responsible for Regulatory Compliance) information
    prrc_first_name VARCHAR(255),
    prrc_last_name VARCHAR(255),
    prrc_email VARCHAR(255),
    prrc_phone VARCHAR(100),
    prrc_responsible_for VARCHAR(500),
    prrc_address VARCHAR(500),
    prrc_postcode VARCHAR(50),
    prrc_country VARCHAR(100),
    
    -- CA (Competent Authority) information
    ca_name VARCHAR(500),
    ca_address VARCHAR(500),
    ca_postcode VARCHAR(50),
    ca_country VARCHAR(100),
    ca_email VARCHAR(255),
    ca_phone VARCHAR(100),
    
    -- Regulatory and classification information
    applicable_legislation VARCHAR(200),
    basic_udi_di_code VARCHAR(255),
    risk_class VARCHAR(50),
    
    -- Device characteristics (boolean flags)
    implantable VARCHAR(10),
    measuring VARCHAR(10),
    reusable VARCHAR(10),
    active VARCHAR(10),
    administering_medicine VARCHAR(10),
    
    -- Device identification
    device_model VARCHAR(500),
    device_name VARCHAR(500),
    issuing_agency VARCHAR(200),
    status VARCHAR(100),
    nomenclature_codes VARCHAR(1000),
    trade_names VARCHAR(1000),
    reference_number VARCHAR(255),
    
    -- Device specifications
    direct_marking VARCHAR(10),
    quantity_of_device VARCHAR(100),
    single_use VARCHAR(10),
    max_reuses VARCHAR(100),
    sterilization_need VARCHAR(10),
    sterile VARCHAR(10),
    contain_latex VARCHAR(10),
    reprocessed VARCHAR(10),
    
    -- Market information
    placed_on_the_market VARCHAR(50),
    market_distribution VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate any existing data from public schema
INSERT INTO eudamed.eudamed_device_registry 
SELECT * FROM public.eudamed_device_registry;

-- Create indexes for performance
CREATE INDEX idx_eudamed_udi_di ON eudamed.eudamed_device_registry(udi_di);
CREATE INDEX idx_eudamed_organization ON eudamed.eudamed_device_registry(organization);
CREATE INDEX idx_eudamed_device_name ON eudamed.eudamed_device_registry(device_name);
CREATE INDEX idx_eudamed_risk_class ON eudamed.eudamed_device_registry(risk_class);

-- Enable RLS
ALTER TABLE eudamed.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view EUDAMED registry data" 
    ON eudamed.eudamed_device_registry 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage EUDAMED registry data" 
    ON eudamed.eudamed_device_registry 
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- Drop the old table from public schema
DROP TABLE IF EXISTS public.eudamed_device_registry CASCADE;