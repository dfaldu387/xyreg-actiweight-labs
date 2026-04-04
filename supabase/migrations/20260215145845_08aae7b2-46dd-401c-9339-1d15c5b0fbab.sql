
-- Update generate_requirement_id to support hierarchical dot-notation IDs
-- When p_category_suffix and p_lineage_base are provided, generates e.g. SYSR-C-01.1
-- When not provided, falls back to current flat behavior (SYSR-001)
CREATE OR REPLACE FUNCTION generate_requirement_id(
  p_product_id UUID,
  p_requirement_type requirement_type DEFAULT 'system',
  p_category_suffix TEXT DEFAULT NULL,
  p_lineage_base TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  type_prefix TEXT;
  old_prefix TEXT;
  full_prefix TEXT;
  next_number INTEGER;
  max_number_new INTEGER := 0;
  max_number_old INTEGER := 0;
  existing_count INTEGER;
BEGIN
  -- Determine type prefix based on requirement type
  CASE p_requirement_type
    WHEN 'system' THEN 
      type_prefix := 'SYSR-';
      old_prefix := 'SR-';
    WHEN 'software' THEN 
      type_prefix := 'SWR-';
      old_prefix := NULL;
    WHEN 'hardware' THEN 
      type_prefix := 'HWR-';
      old_prefix := NULL;
    ELSE 
      type_prefix := 'RS-';
      old_prefix := NULL;
  END CASE;

  -- HIERARCHICAL MODE: when category suffix and lineage base are provided
  IF p_category_suffix IS NOT NULL AND p_lineage_base IS NOT NULL THEN
    -- Build full prefix e.g. "SYSR-C-01." or "SWR-DR-01.1."
    full_prefix := type_prefix || p_category_suffix || '-' || p_lineage_base || '.';
    
    -- Count existing IDs matching this prefix to find next sub-sequence
    SELECT COUNT(*) INTO existing_count
    FROM requirement_specifications
    WHERE product_id = p_product_id
      AND requirement_type = p_requirement_type
      AND requirement_id LIKE full_prefix || '%';
    
    -- Also find the max sub-number to handle any gaps
    SELECT COALESCE(MAX(
      CAST(
        CASE 
          WHEN requirement_id ~ (regexp_replace(full_prefix, '([.\[\]{}()*+?^$|\\])', '\\\1', 'g') || '[0-9]+$')
          THEN SUBSTRING(requirement_id FROM length(full_prefix) + 1)
          ELSE '0'
        END
        AS INTEGER
      )
    ), 0) INTO next_number
    FROM requirement_specifications
    WHERE product_id = p_product_id
      AND requirement_type = p_requirement_type
      AND requirement_id LIKE full_prefix || '%';
    
    next_number := next_number + 1;
    
    -- Return e.g. "SYSR-C-01.1" or "SWR-DR-01.1.2"
    RETURN full_prefix || next_number::TEXT;
  END IF;

  -- FLAT MODE (backward compatible): generate e.g. SYSR-001
  -- Get highest number for new prefix
  SELECT COALESCE(MAX(
    CAST(
      CASE 
        WHEN requirement_id ~ (type_prefix || '[0-9]+$') 
        THEN SUBSTRING(requirement_id FROM length(type_prefix) + 1)
        ELSE '0'
      END 
      AS INTEGER
    )
  ), 0) INTO max_number_new
  FROM requirement_specifications 
  WHERE product_id = p_product_id 
    AND requirement_type = p_requirement_type
    AND requirement_id LIKE type_prefix || '%';

  -- Also check old prefix to avoid collisions
  IF old_prefix IS NOT NULL THEN
    SELECT COALESCE(MAX(
      CAST(
        CASE 
          WHEN requirement_id ~ (old_prefix || '[0-9]+$') 
          THEN SUBSTRING(requirement_id FROM length(old_prefix) + 1)
          ELSE '0'
        END 
        AS INTEGER
      )
    ), 0) INTO max_number_old
    FROM requirement_specifications 
    WHERE product_id = p_product_id 
      AND requirement_type = p_requirement_type
      AND requirement_id LIKE old_prefix || '%';
  END IF;

  -- Use the greater of the two to avoid collisions
  next_number := GREATEST(max_number_new, max_number_old) + 1;

  RETURN type_prefix || LPAD(next_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
