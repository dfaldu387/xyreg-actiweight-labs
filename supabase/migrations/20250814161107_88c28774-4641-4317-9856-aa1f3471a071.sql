-- Create an index on nomenclature_codes for faster EMDN code lookups
CREATE INDEX IF NOT EXISTS idx_eudamed_nomenclature_codes_gin ON eudamed.medical_devices USING gin(nomenclature_codes gin_trgm_ops);

-- Create a more efficient function that uses exact matching first, then fallback to pattern matching
CREATE OR REPLACE FUNCTION public.get_eudamed_devices_by_emdn(emdn_code text, limit_count integer DEFAULT 100)
 RETURNS TABLE(udi_di text, organization text, id_srn text, trade_names text, device_name text, device_model text, basic_udi_di_code text, risk_class text, country text, nomenclature_codes jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- First try exact match for faster results
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
    -- Try to convert text to jsonb, fallback to array with the text value
    CASE 
      WHEN e.nomenclature_codes ~ '^[\[\{].*[\]\}]$' THEN e.nomenclature_codes::jsonb
      ELSE jsonb_build_array(e.nomenclature_codes)
    END as nomenclature_codes
  FROM eudamed.medical_devices e
  WHERE (
    e.nomenclature_codes = emdn_code
    OR e.nomenclature_codes LIKE emdn_code || '%'
    OR e.nomenclature_codes LIKE '%' || emdn_code || '%'
  )
    AND e.udi_di IS NOT NULL
    AND e.organization IS NOT NULL
    AND e.organization != ''
  ORDER BY 
    CASE 
      WHEN e.nomenclature_codes = emdn_code THEN 1
      WHEN e.nomenclature_codes LIKE emdn_code || '%' THEN 2
      ELSE 3
    END,
    e.organization, e.trade_names
  LIMIT limit_count;
END;
$function$;

-- Also try to enable the pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;