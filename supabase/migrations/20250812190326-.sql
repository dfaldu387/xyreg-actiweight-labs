-- Create function to get EUDAMED Widex devices with pagination
CREATE OR REPLACE FUNCTION public.get_eudamed_widex_devices(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  udi_di text,
  organization text,
  id_srn text,
  trade_names text,
  device_name text,
  device_model text,
  basic_udi_di_code text,
  risk_class text,
  country text,
  nomenclature_codes jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.udi_di::text,
    e.organization::text,
    e.id_srn::text,
    e.trade_names::text,
    e.device_name::text,
    e.device_model::text,
    e.basic_udi_di_code::text,
    e.risk_class::text,
    e.country::text,
    e.nomenclature_codes::jsonb
  FROM eudamed.medical_devices e
  WHERE e.organization ILIKE '%widex%'
    AND e.udi_di IS NOT NULL
  ORDER BY e.trade_names
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Create function to count EUDAMED devices for a company
CREATE OR REPLACE FUNCTION public.count_eudamed_company_devices(
  company_name text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO device_count
  FROM eudamed.medical_devices e
  WHERE e.organization ILIKE '%' || company_name || '%'
    AND e.udi_di IS NOT NULL;
    
  RETURN device_count;
END;
$$;