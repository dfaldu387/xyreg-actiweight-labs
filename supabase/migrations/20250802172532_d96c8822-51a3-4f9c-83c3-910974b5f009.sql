-- Simplify function to just return raw data from eudamed schema
CREATE OR REPLACE FUNCTION public.get_emdn_codes()
RETURNS TABLE(
  id text,
  emdn_code text,
  description text,
  level integer,
  parent_id text,
  full_path text,
  risk_class text,
  regulatory_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e."ID"::text as id,
    e.code::text as emdn_code,
    e.description::text,
    e."LEVEL"::integer as level,
    CASE 
      WHEN e.parent_code IS NULL OR e.parent_code = '' THEN NULL
      ELSE e.parent_code::text 
    END as parent_id,
    e.code::text as full_path,
    null::text as risk_class,
    null::text as regulatory_notes
  FROM eudamed.emdn_codes e
  ORDER BY e."LEVEL", e.code;
END;
$$;