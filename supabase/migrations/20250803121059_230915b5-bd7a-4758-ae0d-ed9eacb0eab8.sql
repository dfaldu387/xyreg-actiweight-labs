-- Fix the EMDN function to match actual eudamed schema columns
DROP FUNCTION IF EXISTS public.get_eudamed_emdn_codes();

CREATE OR REPLACE FUNCTION public.get_eudamed_emdn_codes()
RETURNS TABLE(
  emdn_code text,
  emdn_code_description text, 
  emdn_code_name text,
  level integer,
  parent_emdn_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.code::text as emdn_code,
    e.description::text as emdn_code_description,
    e.description::text as emdn_code_name,
    e."LEVEL"::integer as level,
    e.parent_code::text as parent_emdn_code
  FROM eudamed.emdn_codes e
  WHERE e.code IS NOT NULL
  ORDER BY e.code;
END;
$$;