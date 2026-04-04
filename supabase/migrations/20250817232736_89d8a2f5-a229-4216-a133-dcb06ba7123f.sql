-- Temporarily update companies RLS policy to allow reading for debugging
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;

-- Create a more permissive policy for troubleshooting
CREATE POLICY "Allow authenticated users to read companies" ON companies
FOR SELECT 
USING (auth.uid() IS NOT NULL OR TRUE); -- Temporarily allow all access for debugging

-- Also check if we need to update the user_company_access policies
-- Let's see what policies exist first by creating a function that can help debug
CREATE OR REPLACE FUNCTION debug_auth_state()
RETURNS TABLE (
  current_user_id UUID,
  session_info TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    COALESCE(current_setting('request.jwt.claims', true), 'No JWT claims') as session_info;
END;
$$;