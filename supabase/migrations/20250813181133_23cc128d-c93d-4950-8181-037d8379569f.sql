-- Drop and recreate count function with correct parameter name
DROP FUNCTION IF EXISTS public.count_eudamed_company_devices(text);

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