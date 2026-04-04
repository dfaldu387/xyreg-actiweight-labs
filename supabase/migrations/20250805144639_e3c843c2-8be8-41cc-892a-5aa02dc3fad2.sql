-- Move eudamed_device_registry table from eudamed schema to public schema
-- This resolves the "Unknown database error" by ensuring proper user access

-- First, drop any existing table in public if it exists
DROP TABLE IF EXISTS public.eudamed_device_registry CASCADE;

-- Create the table in public schema with all the correct columns
CREATE TABLE public.eudamed_device_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  basic_udi_di text,
  company_name text,
  brand_name text,
  version_or_model text,
  catalogue_reference text,
  nomenclature_code text,
  nomenclature_description text,
  category text,
  sub_category text,
  body_system text,
  temporary_or_short_term_use text,
  invasive_or_surgically_invasive text,
  implantable text,
  active_device text,
  measuring text,
  reusable text,
  need_specific_training text,
  for_single_use text,
  custom_made text,
  sterile text,
  measuring_function text,
  class_date_applied text,
  class_rule_set text,
  device_subject_to_regulation text,
  year_placed_on_market integer,
  unit_of_use_udi_di text,
  package_udi_di text,
  device_sizes text,
  additional_device_information text,
  website_additional_information text,
  is_suspension_ceased_to_be_available text,
  on_market_before_25_may_2021 text,
  free_sale_certificate_available text,
  location_of_entity_standard text,
  authorised_representative_within_union_if_applicable text,
  post_market_surveillance_system text,
  device_registration text,
  person_responsible_for_regulatory_compliance text,
  risk_class text,
  verification_of_general_safety_performance_requirements text,
  clinical_evaluation_summary_and_clinical_evidence text,
  automatic_changeover text,
  srn_number text,
  actor_name text,
  actor_registration_number text,
  actor_single_registration_number text,
  actor_address_of_registered_place_of_business text
);

-- Copy data from eudamed schema if it exists
INSERT INTO public.eudamed_device_registry 
SELECT * FROM eudamed.eudamed_device_registry
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_basic_udi_di ON public.eudamed_device_registry(basic_udi_di);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_company_name ON public.eudamed_device_registry(company_name);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_srn_number ON public.eudamed_device_registry(srn_number);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_nomenclature_code ON public.eudamed_device_registry(nomenclature_code);
CREATE INDEX IF NOT EXISTS idx_eudamed_device_registry_risk_class ON public.eudamed_device_registry(risk_class);

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

-- Drop the old table from eudamed schema if it exists
DROP TABLE IF EXISTS eudamed.eudamed_device_registry CASCADE;

-- Drop the eudamed schema if it's empty
DROP SCHEMA IF EXISTS eudamed CASCADE;