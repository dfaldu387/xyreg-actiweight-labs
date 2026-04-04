-- Create generic function to get EUDAMED devices by company name or SRN
CREATE OR REPLACE FUNCTION public.get_eudamed_devices_by_company(
  company_identifier text,
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  udi_di text,
  organization text,
  id_srn text,
  organization_status text,
  address text,
  postcode text,
  country text,
  phone text,
  email text,
  website text,
  prrc_first_name text,
  prrc_last_name text,
  prrc_email text,
  prrc_phone text,
  prrc_responsible_for text,
  prrc_address text,
  prrc_postcode text,
  prrc_country text,
  ca_name text,
  ca_address text,
  ca_postcode text,
  ca_country text,
  ca_email text,
  ca_phone text,
  applicable_legislation text,
  basic_udi_di_code text,
  risk_class text,
  implantable boolean,
  measuring boolean,
  reusable boolean,
  active boolean,
  administering_medicine boolean,
  device_model text,
  device_name text,
  issuing_agency text,
  status text,
  nomenclature_codes jsonb,
  trade_names text,
  reference_number text,
  direct_marking boolean,
  quantity_of_device text,
  single_use boolean,
  max_reuses integer,
  sterilization_need boolean,
  sterile boolean,
  contain_latex boolean,
  reprocessed boolean,
  placed_on_the_market text,
  market_distribution text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.udi_di::text,
    e.organization::text,
    e.id_srn::text,
    e.organization_status::text,
    e.address::text,
    e.postcode::text,
    e.country::text,
    e.phone::text,
    e.email::text,
    e.website::text,
    e.prrc_first_name::text,
    e.prrc_last_name::text,
    e.prrc_email::text,
    e.prrc_phone::text,
    e.prrc_responsible_for::text,
    e.prrc_address::text,
    e.prrc_postcode::text,
    e.prrc_country::text,
    e.ca_name::text,
    e.ca_address::text,
    e.ca_postcode::text,
    e.ca_country::text,
    e.ca_email::text,
    e.ca_phone::text,
    e.applicable_legislation::text,
    e.basic_udi_di_code::text,
    e.risk_class::text,
    e.implantable::boolean,
    e.measuring::boolean,
    e.reusable::boolean,
    e.active::boolean,
    e.administering_medicine::boolean,
    e.device_model::text,
    e.device_name::text,
    e.issuing_agency::text,
    e.status::text,
    e.nomenclature_codes::jsonb,
    e.trade_names::text,
    e.reference_number::text,
    e.direct_marking::boolean,
    e.quantity_of_device::text,
    e.single_use::boolean,
    e.max_reuses::integer,
    e.sterilization_need::boolean,
    e.sterile::boolean,
    e.contain_latex::boolean,
    e.reprocessed::boolean,
    e.placed_on_the_market::text,
    e.market_distribution::text
  FROM eudamed.medical_devices e
  WHERE (
    -- Search by organization name (case-insensitive, partial match)
    e.organization ILIKE '%' || company_identifier || '%'
    -- Search by SRN if provided in SRN format (exact match)
    OR (company_identifier ~ '^[A-Z]{2}-[A-Z]{2}-[0-9]+$' AND e.id_srn = company_identifier)
    -- Search by SRN partial match for company codes
    OR e.id_srn ILIKE company_identifier || '%'
  )
    AND e.udi_di IS NOT NULL
    AND e.organization IS NOT NULL
    AND e.organization != ''
  ORDER BY e.organization, e.trade_names
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$

-- Update count function to work generically
CREATE OR REPLACE FUNCTION public.count_eudamed_company_devices(company_identifier text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  device_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO device_count
  FROM eudamed.medical_devices e
  WHERE (
    -- Search by organization name (case-insensitive, partial match)
    e.organization ILIKE '%' || company_identifier || '%'
    -- Search by SRN if provided in SRN format (exact match)
    OR (company_identifier ~ '^[A-Z]{2}-[A-Z]{2}-[0-9]+$' AND e.id_srn = company_identifier)
    -- Search by SRN partial match for company codes
    OR e.id_srn ILIKE company_identifier || '%'
  )
    AND e.udi_di IS NOT NULL
    AND e.organization IS NOT NULL
    AND e.organization != '';
    
  RETURN device_count;
END;
$function$