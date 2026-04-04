-- Completely drop and recreate the function to clear any caching issues
DROP FUNCTION IF EXISTS public.update_product_fda_code CASCADE;

-- Create the function with explicit parameter names to avoid conflicts
CREATE FUNCTION public.update_product_fda_code(
  product_id_param uuid,
  new_fda_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Log the update attempt
  RAISE LOG 'Updating FDA product code for product % to %', product_id_param, new_fda_code;
  
  -- Update the FDA product code for the specified product
  UPDATE products 
  SET 
    fda_product_code = new_fda_code,
    updated_at = now()
  WHERE id = product_id_param;
  
  -- Check if the update was successful
  IF FOUND THEN
    RAISE LOG 'Successfully updated FDA product code for product %', product_id_param;
    RETURN true;
  ELSE
    RAISE LOG 'No product found with id %', product_id_param;
    RETURN false;
  END IF;
END;
$$;