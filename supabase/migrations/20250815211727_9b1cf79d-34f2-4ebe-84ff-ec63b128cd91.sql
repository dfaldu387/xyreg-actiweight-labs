-- Drop all existing versions of the function to resolve overloading conflict
DROP FUNCTION IF EXISTS update_product_fda_code(uuid, text);
DROP FUNCTION IF EXISTS update_product_fda_code(uuid, text, uuid);

-- Create a single clean version of the function
CREATE OR REPLACE FUNCTION update_product_fda_code(
  product_id_param uuid,
  new_fda_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Update the FDA product code for the specified product
  UPDATE products 
  SET 
    fda_product_code = new_fda_code,
    updated_at = now()
  WHERE id = product_id_param;
  
  -- Check if the update was successful
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;