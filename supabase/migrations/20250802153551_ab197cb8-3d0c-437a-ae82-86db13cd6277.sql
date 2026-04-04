-- Fix the delete_leaf_emdn_codes function to handle NULL values properly
CREATE OR REPLACE FUNCTION delete_leaf_emdn_codes()
RETURNS TABLE(deleted_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete codes that are not referenced as parents by any other codes
  -- Use NOT EXISTS instead of NOT IN to handle NULL values properly
  RETURN QUERY
  DELETE FROM emdn_codes e1
  WHERE NOT EXISTS (
    SELECT 1 
    FROM emdn_codes e2 
    WHERE e2.parent_id = e1.id
  )
  RETURNING id;
END;
$$;