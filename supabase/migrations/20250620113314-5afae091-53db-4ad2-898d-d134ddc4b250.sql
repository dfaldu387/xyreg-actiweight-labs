


-- Comprehensive cleanup of all create_project_for_existing_product function versions
-- This addresses the jsonb type mismatch error by ensuring only one clean function exists

-- Drop ALL possible overloaded versions of the function with different signatures
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, jsonb, uuid, uuid, text);
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, text[], uuid, uuid, text);
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, jsonb, uuid, uuid);
DROP FUNCTION IF EXISTS create_project_for_existing_product(text, text, text[], uuid, uuid);

-- Also try dropping by casting parameters to handle any other variations
DROP FUNCTION IF EXISTS public.create_project_for_existing_product CASCADE;

-- Create the definitive version with exact parameter names that match our service call
CREATE OR REPLACE FUNCTION create_project_for_existing_product(
  p_project_name text,
  p_project_category text,
  p_project_types text, -- JSON string that we'll parse to jsonb
  p_selected_product_id uuid, -- This matches our service call parameter
  p_company_id uuid,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_product_id uuid;
  v_project_id uuid;
  v_parent_product record;
  v_next_version text;
  v_new_product_name text;
  v_project_types_jsonb jsonb;
BEGIN
  -- Get the selected product details using the correct parameter name
  SELECT * INTO v_parent_product
  FROM products 
  WHERE id = p_selected_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected product not found: %', p_selected_product_id;
  END IF;
  
  -- Determine the root product ID for version numbering
  DECLARE
    v_root_product_id uuid;
  BEGIN
    v_root_product_id := COALESCE(v_parent_product.parent_product_id, v_parent_product.id);
    
    -- Get the next version number
    SELECT get_next_version_number(v_root_product_id) INTO v_next_version;
    
    -- Create the new product name
    v_new_product_name := regexp_replace(v_parent_product.name, '\s*\(v[0-9]+\.[0-9]+\).*$', '') || ' (v' || v_next_version || ')';
  END;
  
  -- Parse project types JSON string directly to jsonb (this fixes the type mismatch)
  v_project_types_jsonb := p_project_types::jsonb;
  
  -- Create the new product version
  INSERT INTO products (
    name,
    description,
    company_id,
    parent_product_id,
    version,
    status,
    class,
    markets,
    project_types, -- This column expects jsonb
    is_line_extension,
    is_archived
  ) VALUES (
    v_new_product_name,
    COALESCE(p_description, v_parent_product.description),
    p_company_id,
    v_parent_product.id, -- Set parent to the selected product
    v_next_version,
    'In Development',
    v_parent_product.class,
    v_parent_product.markets,
    v_project_types_jsonb, -- Using jsonb directly
    false,
    false
  )
  RETURNING id INTO v_new_product_id;
  
  -- Create the project linked to the new product version
  INSERT INTO projects (
    name,
    description,
    project_category,
    project_types, -- This column also expects jsonb
    company_id,
    product_id,
    status
  ) VALUES (
    COALESCE(p_project_name, 'Project for ' || v_new_product_name),
    p_description,
    p_project_category,
    v_project_types_jsonb, -- Using jsonb directly
    p_company_id,
    v_new_product_id,
    'Active'
  )
  RETURNING id INTO v_project_id;
  
  -- Return the project ID (the frontend expects this)
  RETURN v_project_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating project for existing product: %', SQLERRM;
END;
$$;

