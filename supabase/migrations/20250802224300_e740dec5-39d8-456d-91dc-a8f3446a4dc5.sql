-- Create EUDAMED Device Registry table for 800k medical device records
-- This table will store the comprehensive device information from the regulatory database

CREATE TABLE public.eudamed_device_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core UDI Information (most frequently queried)
  udi_di text NOT NULL,
  basic_udi_di_code text,
  issuing_agency text,
  reference_number text,
  
  -- Organization Information
  organization text NOT NULL,
  organization_id_srn text,
  organization_status text,
  organization_address text,
  organization_postcode text,
  organization_country text,
  organization_phone text,
  organization_email text,
  organization_website text,
  
  -- Person Responsible for Regulatory Compliance (PRRC)
  prrc_first_name text,
  prrc_last_name text,
  prrc_email text,
  prrc_phone text,
  prrc_responsible_for text,
  prrc_address text,
  prrc_postcode text,
  prrc_country text,
  
  -- Competent Authority (CA) Information
  ca_name text,
  ca_address text,
  ca_postcode text,
  ca_country text,
  ca_email text,
  ca_phone text,
  
  -- Regulatory Information
  applicable_legislation text,
  risk_class text,
  status text,
  nomenclature_codes text, -- Can contain multiple codes
  
  -- Device Characteristics (boolean flags for device properties)
  is_implantable boolean DEFAULT false,
  is_measuring boolean DEFAULT false,
  is_reusable boolean DEFAULT false,
  is_active boolean DEFAULT false,
  is_administering_medicine boolean DEFAULT false,
  is_single_use boolean DEFAULT false,
  requires_sterilization boolean DEFAULT false,
  is_sterile boolean DEFAULT false,
  contains_latex boolean DEFAULT false,
  is_reprocessed boolean DEFAULT false,
  
  -- Device Details
  device_model text,
  device_name text NOT NULL,
  trade_names text, -- Can contain multiple trade names
  direct_marking text,
  quantity_of_device text,
  max_reuses integer,
  
  -- Market Information
  placed_on_market date,
  market_distribution text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for read access (this is a reference database)
CREATE POLICY "Allow read access to EUDAMED registry" 
ON public.eudamed_device_registry 
FOR SELECT 
USING (true);

-- Prevent modifications to preserve data integrity
CREATE POLICY "Prevent unauthorized modifications" 
ON public.eudamed_device_registry 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Create optimal indexes for fast lookups and searches

-- Primary lookup indexes (most frequent queries)
CREATE INDEX idx_eudamed_udi_di ON public.eudamed_device_registry USING btree (udi_di);
CREATE INDEX idx_eudamed_basic_udi_di ON public.eudamed_device_registry USING btree (basic_udi_di_code);
CREATE INDEX idx_eudamed_organization ON public.eudamed_device_registry USING btree (organization);
CREATE INDEX idx_eudamed_org_id_srn ON public.eudamed_device_registry USING btree (organization_id_srn);

-- Composite indexes for common query patterns
CREATE INDEX idx_eudamed_org_country ON public.eudamed_device_registry USING btree (organization, organization_country);
CREATE INDEX idx_eudamed_risk_class_country ON public.eudamed_device_registry USING btree (risk_class, organization_country);
CREATE INDEX idx_eudamed_device_model_org ON public.eudamed_device_registry USING btree (device_model, organization);
CREATE INDEX idx_eudamed_market_status ON public.eudamed_device_registry USING btree (placed_on_market, status);

-- Text search indexes for device names and trade names
CREATE INDEX idx_eudamed_device_name_gin ON public.eudamed_device_registry USING gin (to_tsvector('english', device_name));
CREATE INDEX idx_eudamed_trade_names_gin ON public.eudamed_device_registry USING gin (to_tsvector('english', trade_names));

-- Regulatory and classification indexes
CREATE INDEX idx_eudamed_applicable_legislation ON public.eudamed_device_registry USING btree (applicable_legislation);
CREATE INDEX idx_eudamed_issuing_agency ON public.eudamed_device_registry USING btree (issuing_agency);
CREATE INDEX idx_eudamed_nomenclature_codes ON public.eudamed_device_registry USING btree (nomenclature_codes);

-- Partial indexes for boolean flags (only index true values to save space)
CREATE INDEX idx_eudamed_implantable ON public.eudamed_device_registry USING btree (is_implantable) WHERE is_implantable = true;
CREATE INDEX idx_eudamed_active ON public.eudamed_device_registry USING btree (is_active) WHERE is_active = true;
CREATE INDEX idx_eudamed_sterile ON public.eudamed_device_registry USING btree (is_sterile) WHERE is_sterile = true;
CREATE INDEX idx_eudamed_single_use ON public.eudamed_device_registry USING btree (is_single_use) WHERE is_single_use = true;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_eudamed_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_eudamed_registry_updated_at
  BEFORE UPDATE ON public.eudamed_device_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_eudamed_registry_updated_at();

-- Add helpful comments for documentation
COMMENT ON TABLE public.eudamed_device_registry IS 'EUDAMED device registry containing 800k+ medical device records for regulatory compliance and market intelligence';
COMMENT ON COLUMN public.eudamed_device_registry.udi_di IS 'Unique Device Identifier - Device Identifier';
COMMENT ON COLUMN public.eudamed_device_registry.basic_udi_di_code IS 'Basic UDI-DI code for device families';
COMMENT ON COLUMN public.eudamed_device_registry.organization IS 'Device manufacturer or responsible organization';
COMMENT ON COLUMN public.eudamed_device_registry.risk_class IS 'Medical device risk classification (I, IIa, IIb, III)';
COMMENT ON COLUMN public.eudamed_device_registry.placed_on_market IS 'Date when device was first placed on the market';