-- Create a function to delete leaf EMDN codes (codes with no children)
CREATE OR REPLACE FUNCTION delete_leaf_emdn_codes()
RETURNS TABLE(deleted_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete codes that are not referenced as parents by any other codes
  RETURN QUERY
  DELETE FROM emdn_codes 
  WHERE id NOT IN (
    SELECT DISTINCT parent_id 
    FROM emdn_codes 
    WHERE parent_id IS NOT NULL
  )
  RETURNING id;
END;
$$;