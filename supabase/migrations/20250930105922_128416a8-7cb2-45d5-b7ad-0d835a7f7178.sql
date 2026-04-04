-- Fix the generate_requirement_id function to handle existing requirements properly
CREATE OR REPLACE FUNCTION generate_requirement_id(
  p_product_id UUID,
  p_requirement_type requirement_type DEFAULT 'system'
) RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  next_number INTEGER;
  max_existing_id TEXT;
  max_number INTEGER;
BEGIN
  -- Determine prefix based on requirement type
  CASE p_requirement_type
    WHEN 'system' THEN prefix := 'SR-';
    WHEN 'software' THEN prefix := 'SWR-';
    WHEN 'hardware' THEN prefix := 'HWR-';
    ELSE prefix := 'RS-'; -- fallback for legacy
  END CASE;

  -- Get the highest existing number for this product and type
  SELECT requirement_id INTO max_existing_id
  FROM requirement_specifications 
  WHERE product_id = p_product_id 
    AND requirement_type = p_requirement_type
    AND requirement_id LIKE prefix || '%'
  ORDER BY 
    CAST(
      CASE 
        WHEN requirement_id ~ (prefix || '[0-9]+$') 
        THEN SUBSTRING(requirement_id FROM length(prefix) + 1)
        ELSE '0'
      END 
      AS INTEGER
    ) DESC
  LIMIT 1;

  -- Extract the number and increment
  IF max_existing_id IS NOT NULL THEN
    max_number := CAST(SUBSTRING(max_existing_id FROM length(prefix) + 1) AS INTEGER);
    next_number := max_number + 1;
  ELSE
    next_number := 1;
  END IF;

  -- Return the formatted ID
  RETURN prefix || LPAD(next_number::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;