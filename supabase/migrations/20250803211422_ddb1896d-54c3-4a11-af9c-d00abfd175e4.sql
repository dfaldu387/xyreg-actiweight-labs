-- Create RPC function to get EMDN codes by category prefix
CREATE OR REPLACE FUNCTION public.get_eudamed_emdn_codes_by_prefix(prefix_letter text)
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
  WHERE e.code LIKE (prefix_letter || '%')
  ORDER BY e.code;
END;
$$;