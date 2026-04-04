
-- Update generate_requirement_id: change system prefix from SR- to SYSR-
-- Also handle existing SR- records to prevent ID collisions
CREATE OR REPLACE FUNCTION generate_requirement_id(
  p_product_id UUID,
  p_requirement_type requirement_type DEFAULT 'system'
) RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  old_prefix TEXT;
  next_number INTEGER;
  max_number_new INTEGER := 0;
  max_number_old INTEGER := 0;
BEGIN
  -- Determine prefix based on requirement type
  CASE p_requirement_type
    WHEN 'system' THEN 
      prefix := 'SYSR-';
      old_prefix := 'SR-';
    WHEN 'software' THEN 
      prefix := 'SWR-';
      old_prefix := NULL;
    WHEN 'hardware' THEN 
      prefix := 'HWR-';
      old_prefix := NULL;
    ELSE 
      prefix := 'RS-';
      old_prefix := NULL;
  END CASE;

  -- Get highest number for new prefix
  SELECT COALESCE(MAX(
    CAST(
      CASE 
        WHEN requirement_id ~ (prefix || '[0-9]+$') 
        THEN SUBSTRING(requirement_id FROM length(prefix) + 1)
        ELSE '0'
      END 
      AS INTEGER
    )
  ), 0) INTO max_number_new
  FROM requirement_specifications 
  WHERE product_id = p_product_id 
    AND requirement_type = p_requirement_type
    AND requirement_id LIKE prefix || '%';

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

  RETURN prefix || LPAD(next_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
