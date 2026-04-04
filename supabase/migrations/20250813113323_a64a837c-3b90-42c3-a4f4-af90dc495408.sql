-- Update function to properly search JSON nomenclature codes
CREATE OR REPLACE FUNCTION public.get_eudamed_devices_by_emdn(
  emdn_code text,
  limit_count integer DEFAULT 100
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
SET search_path TO 'public', 'pg_temp'
AS $function$
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
  WHERE (
    e.nomenclature_codes::text ILIKE '%' || emdn_code || '%'
    OR e.nomenclature_codes @> ('["' || emdn_code || '"]')::jsonb
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(e.nomenclature_codes) AS codes
      WHERE codes = emdn_code
    )
  )
    AND e.udi_di IS NOT NULL
    AND e.organization IS NOT NULL
    AND e.organization != ''
  ORDER BY e.organization, e.trade_names
  LIMIT limit_count;
END;
$function$;