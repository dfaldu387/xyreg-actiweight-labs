
-- Drop the 2-param overload and keep only the 4-param version with defaults
DROP FUNCTION IF EXISTS public.generate_requirement_id(uuid, public.requirement_type);

-- Recreate the single function with default NULL params for category_suffix and lineage_base
CREATE OR REPLACE FUNCTION public.generate_requirement_id(
  p_product_id uuid,
  p_requirement_type public.requirement_type DEFAULT 'system',
  p_category_suffix text DEFAULT NULL,
  p_lineage_base text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_next_number integer;
  v_requirement_id text;
  v_base_prefix text;
BEGIN
  -- Determine base prefix from requirement type
  CASE p_requirement_type
    WHEN 'system' THEN v_base_prefix := 'SYSR';
    WHEN 'software' THEN v_base_prefix := 'SWR';
    WHEN 'hardware' THEN v_base_prefix := 'HWR';
    ELSE v_base_prefix := 'REQ';
  END CASE;

  -- If category suffix provided, use lineage-based ID
  IF p_category_suffix IS NOT NULL AND p_lineage_base IS NOT NULL THEN
    -- Find next sub-number for this lineage base
    SELECT COALESCE(MAX(
      CASE 
        WHEN requirement_id LIKE p_lineage_base || '.%' THEN
          CAST(SPLIT_PART(requirement_id, '.', array_length(string_to_array(p_lineage_base, '.'), 1) + 1) AS integer)
        ELSE 0
      END
    ), 0) + 1
    INTO v_next_number
    FROM requirement_specifications
    WHERE product_id = p_product_id
      AND requirement_type = p_requirement_type
      AND requirement_id LIKE p_lineage_base || '.%';
    
    v_requirement_id := p_lineage_base || '.' || v_next_number;
  ELSE
    -- Standard sequential ID generation
    v_prefix := v_base_prefix || '-';
    
    SELECT COALESCE(MAX(
      CASE 
        WHEN requirement_id ~ ('^' || v_prefix || '[0-9]+$') THEN
          CAST(SUBSTRING(requirement_id FROM LENGTH(v_prefix) + 1) AS integer)
        ELSE 0
      END
    ), 0) + 1
    INTO v_next_number
    FROM requirement_specifications
    WHERE product_id = p_product_id
      AND requirement_type = p_requirement_type;
    
    v_requirement_id := v_prefix || LPAD(v_next_number::text, 2, '0');
  END IF;

  RETURN v_requirement_id;
END;
$$;
