-- Create a new RPC function to get ALL EMDN codes without any limits
CREATE OR REPLACE FUNCTION public.get_all_eudamed_emdn_codes()
RETURNS TABLE(code text, description text, temp text, "LEVEL" integer, parent_code text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.code::text,
    e.description::text,
    e.temp::text,
    e."LEVEL"::integer,
    e.parent_code::text
  FROM eudamed.emdn_codes e
  ORDER BY e.code;
END;
$function$;