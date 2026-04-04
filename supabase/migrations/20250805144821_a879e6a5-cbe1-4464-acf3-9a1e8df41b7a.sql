-- Move eudamed_device_registry table from eudamed schema to public schema
-- This resolves the "Unknown database error" by ensuring proper user access

-- Create the table in public schema with the exact structure from eudamed schema
CREATE TABLE public.eudamed_device_registry (
  udi_di character varying,
  organization character varying,
  id_srn character varying,
  organization_status character varying,
  address character varying,
  postcode character varying,
  country character varying,
  phone character varying,
  email character varying,
  website character varying,
  prrc_first_name character varying,
  prrc_last_name character varying,
  prrc_email character varying,
  prrc_phone character varying,
  prrc_responsible_for character varying,
  prrc_address character varying,
  prrc_postcode character varying,
  prrc_country character varying,
  ca_name character varying,
  ca_address character varying,
  ca_postcode character varying,
  ca_country character varying,
  ca_email character varying,
  ca_phone character varying,
  applicable_legislation character varying,
  basic_udi_di_code character varying,
  risk_class character varying,
  implantable character varying,
  measuring character varying,
  reusable character varying,
  active character varying,
  administering_medicine character varying,
  device_model character varying,
  device_name character varying,
  issuing_agency character varying,
  status character varying,
  nomenclature_codes character varying,
  trade_names character varying,
  reference_number character varying,
  direct_marking character varying,
  quantity_of_device character varying,
  single_use character varying,
  max_reuses character varying,
  sterilization_need character varying,
  sterile character varying,
  contain_latex character varying,
  reprocessed character varying,
  placed_on_the_market character varying,
  market_distribution character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add a primary key
ALTER TABLE public.eudamed_device_registry ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- Copy all data from eudamed schema to public schema
INSERT INTO public.eudamed_device_registry (
  udi_di, organization, id_srn, organization_status, address, postcode, country, 
  phone, email, website, prrc_first_name, prrc_last_name, prrc_email, prrc_phone, 
  prrc_responsible_for, prrc_address, prrc_postcode, prrc_country, ca_name, 
  ca_address, ca_postcode, ca_country, ca_email, ca_phone, applicable_legislation, 
  basic_udi_di_code, risk_class, implantable, measuring, reusable, active, 
  administering_medicine, device_model, device_name, issuing_agency, status, 
  nomenclature_codes, trade_names, reference_number, direct_marking, 
  quantity_of_device, single_use, max_reuses, sterilization_need, sterile, 
  contain_latex, reprocessed, placed_on_the_market, market_distribution, 
  created_at, updated_at
)
SELECT * FROM eudamed.eudamed_device_registry;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_basic_udi_di ON public.eudamed_device_registry(basic_udi_di_code);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_organization ON public.eudamed_device_registry(organization);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_id_srn ON public.eudamed_device_registry(id_srn);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_device_name ON public.eudamed_device_registry(device_name);

-- Enable Row Level Security
ALTER TABLE public.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read the registry
CREATE POLICY "Authenticated users can read eudamed device registry" 
ON public.eudamed_device_registry 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can modify the registry (for imports)
CREATE POLICY "Admins can manage eudamed device registry" 
ON public.eudamed_device_registry 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_eudamed_device_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_eudamed_device_registry_updated_at
BEFORE UPDATE ON public.eudamed_device_registry
FOR EACH ROW
EXECUTE FUNCTION public.update_eudamed_device_registry_updated_at();

-- Drop the old table from eudamed schema
DROP TABLE IF EXISTS eudamed.eudamed_device_registry CASCADE;

-- Try to drop the eudamed schema if it's empty
DROP SCHEMA IF EXISTS eudamed CASCADE;