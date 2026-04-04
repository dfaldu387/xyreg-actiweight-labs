-- Update function to build proper hierarchy paths
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
  WITH RECURSIVE hierarchy AS (
    -- Base case: Level 1 codes (no parent)
    SELECT 
      e."ID"::text as id,
      e.code::text as emdn_code,
      e.description::text,
      e."LEVEL"::integer as level,
      e.parent_code::text as parent_id,
      e.code::text as full_path,
      null::text as risk_class,
      null::text as regulatory_notes
    FROM eudamed.emdn_codes e
    WHERE e.parent_code IS NULL OR e.parent_code = ''
    
    UNION ALL
    
    -- Recursive case: Child codes
    SELECT 
      e."ID"::text,
      e.code::text,
      e.description::text,
      e."LEVEL"::integer,
      e.parent_code::text,
      (h.full_path || ' > ' || e.code)::text,
      null::text,
      null::text
    FROM eudamed.emdn_codes e
    INNER JOIN hierarchy h ON e.parent_code = h.emdn_code
  )
  SELECT * FROM hierarchy
  ORDER BY level, emdn_code;
END;
$$;