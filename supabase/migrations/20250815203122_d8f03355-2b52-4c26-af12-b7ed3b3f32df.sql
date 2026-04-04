-- Add a function to update product FDA product code
CREATE OR REPLACE FUNCTION update_product_fda_code(
  product_id_param UUID,
  new_fda_code TEXT,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Check if user has access to this product
  IF NOT EXISTS (
    SELECT 1 FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = product_id_param 
    AND (c.created_by = user_id_param OR user_id_param IS NULL)
  ) THEN
    RAISE EXCEPTION 'Access denied to product %', product_id_param;
  END IF;

  -- Update the product's FDA product code
  UPDATE products 
  SET 
    fda_product_code = new_fda_code,
    updated_at = now()
  WHERE id = product_id_param;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count > 0;
END;
$$;