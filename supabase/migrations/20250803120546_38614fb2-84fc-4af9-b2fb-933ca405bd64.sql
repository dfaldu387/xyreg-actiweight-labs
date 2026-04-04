-- Drop existing function and recreate with correct eudamed schema reference
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
    e.emdn_code::text,
    e.emdn_code_description::text,
    e.emdn_code_name::text,
    e.level::integer,
    e.parent_emdn_code::text
  FROM eudamed.emdn_codes e
  ORDER BY e.emdn_code;
END;
$$;