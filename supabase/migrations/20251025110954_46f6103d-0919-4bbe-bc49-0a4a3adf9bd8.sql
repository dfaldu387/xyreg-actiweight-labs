-- Create RPC function to get bundle company name
-- This is used by the sidebar to show the correct company when viewing bundles

CREATE OR REPLACE FUNCTION get_bundle_company_name(p_bundle_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  SELECT c.name INTO v_company_name
  FROM product_bundle_groups pbg
  JOIN companies c ON c.id = pbg.company_id
  WHERE pbg.id = p_bundle_id;
  
  RETURN v_company_name;
END;
$$;