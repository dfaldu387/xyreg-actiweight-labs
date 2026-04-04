-- Create function to get EMDN codes from eudamed schema
CREATE OR REPLACE FUNCTION public.get_eudamed_emdn_codes()
RETURNS TABLE(
  code text,
  description text,
  temp text,
  "LEVEL" integer,
  parent_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;