
-- Add missing database functions for product version management

-- Function to get the next version number for a product family
CREATE OR REPLACE FUNCTION get_next_version_number(root_product_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  latest_version text;
  major_version integer;
  minor_version integer;
  next_version text;
BEGIN
  -- Get the latest version for the product family
  SELECT version INTO latest_version
  FROM products 
  WHERE (id = root_product_id OR parent_product_id = root_product_id)
  AND version IS NOT NULL
  ORDER BY 
    CAST(split_part(version, '.', 1) AS INTEGER) DESC,
    CAST(split_part(version, '.', 2) AS INTEGER) DESC
  LIMIT 1;
  
  -- If no version exists, start with 1.0
  IF latest_version IS NULL THEN
    RETURN '1.0';
  END IF;
  
  -- Parse the version and increment major version
  major_version := CAST(split_part(latest_version, '.', 1) AS INTEGER);
  minor_version := CAST(split_part(latest_version, '.', 2) AS INTEGER);
  
  -- Increment major version, reset minor to 0
  major_version := major_version + 1;
  minor_version := 0;
  
  -- Return the next version
  next_version := major_version || '.' || minor_version;
  RETURN next_version;
END;
$$;

-- Function to create a new product version
CREATE OR REPLACE FUNCTION create_product_version(
  p_base_product_id uuid,
  p_project_name text DEFAULT NULL,
  p_project_description text DEFAULT NULL,
  p_project_category text DEFAULT 'EXISTING PRODUCT',
  p_project_types text[] DEFAULT ARRAY['Product Improvement / Feature Enhancement']
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_product record;
  v_new_product_id uuid;
  v_project_id uuid;
  v_next_version text;
  v_new_product_name text;
  v_user_id uuid;
BEGIN
  -- Get the current authenticated user
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get the base product details
  SELECT * INTO v_base_product
  FROM products 
  WHERE id = p_base_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Base product not found: %', p_base_product_id;
  END IF;
  
  -- Determine the root product ID for version numbering
  DECLARE
    v_root_product_id uuid;
  BEGIN
    v_root_product_id := COALESCE(v_base_product.parent_product_id, v_base_product.id);
    
    -- Get the next version number
    SELECT get_next_version_number(v_root_product_id) INTO v_next_version;
    
    -- Create the new product name with version
    v_new_product_name := regexp_replace(v_base_product.name, '\s*\(v[0-9]+\.[0-9]+\).*$', '') || ' (v' || v_next_version || ')';
  END;
  
  -- Create the new product version
  INSERT INTO products (
    name,
    description,
    company_id,
    parent_product_id,
    version,
    status,
    class,
    product_market,
    project_types,
    is_line_extension,
    is_archived,
    device_category,
    intended_use,
    indications_for_use,
    contraindications
  ) VALUES (
    v_new_product_name,
    COALESCE(p_project_description, v_base_product.description),
    v_base_product.company_id,
    v_base_product.id, -- Set parent to the base product
    v_next_version,
    'In Development',
    v_base_product.class,
    v_base_product.product_market,
    p_project_types,
    false, -- This is a version, not a line extension
    false,
    v_base_product.device_category,
    v_base_product.intended_use,
    v_base_product.indications_for_use,
    v_base_product.contraindications
  )
  RETURNING id INTO v_new_product_id;
  
  -- Create the project linked to the new product version
  INSERT INTO projects (
    name,
    description,
    project_category,
    project_types,
    company_id,
    product_id,
    status
  ) VALUES (
    COALESCE(p_project_name, 'Project for ' || v_new_product_name),
    p_project_description,
    p_project_category,
    p_project_types,
    v_base_product.company_id,
    v_new_product_id,
    'Active'
  )
  RETURNING id INTO v_project_id;
  
  -- Log version creation in history
  INSERT INTO product_version_history (
    product_id,
    parent_product_id,
    version,
    version_type,
    created_by,
    change_description,
    metadata
  ) VALUES (
    v_new_product_id,
    v_base_product.id,
    v_next_version,
    'major',
    v_user_id,
    'New product version created from ' || v_base_product.name,
    jsonb_build_object(
      'base_product_id', p_base_product_id,
      'base_product_name', v_base_product.name,
      'base_version', v_base_product.version
    )
  );
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_new_product_id,
    'project_id', v_project_id,
    'version', v_next_version,
    'product_name', v_new_product_name,
    'message', 'Product version created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create product version: ' || SQLERRM
  );
END;
$$;

-- Function to get product version hierarchy
CREATE OR REPLACE FUNCTION get_product_version_hierarchy(root_product_id uuid)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  version text,
  parent_id uuid,
  level integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE version_tree AS (
    -- Base case: root product
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COALESCE(p.version, '1.0') as version,
      p.parent_product_id as parent_id,
      0 as level,
      p.inserted_at as created_at
    FROM products p
    WHERE p.id = root_product_id
    
    UNION ALL
    
    -- Recursive case: child versions
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COALESCE(p.version, '1.0') as version,
      p.parent_product_id as parent_id,
      vt.level + 1 as level,
      p.inserted_at as created_at
    FROM products p
    INNER JOIN version_tree vt ON p.parent_product_id = vt.product_id
  )
  SELECT 
    vt.product_id,
    vt.product_name,
    vt.version,
    vt.parent_id,
    vt.level,
    vt.created_at
  FROM version_tree vt
  ORDER BY vt.level, vt.created_at;
END;
$$;

-- Function for version comparison
CREATE OR REPLACE FUNCTION compare_versions(version1 text, version2 text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v1_major integer;
  v1_minor integer;
  v2_major integer;
  v2_minor integer;
BEGIN
  -- Parse version1
  v1_major := CAST(split_part(version1, '.', 1) AS INTEGER);
  v1_minor := CAST(split_part(version1, '.', 2) AS INTEGER);
  
  -- Parse version2
  v2_major := CAST(split_part(version2, '.', 1) AS INTEGER);
  v2_minor := CAST(split_part(version2, '.', 2) AS INTEGER);
  
  -- Compare versions
  IF v1_major > v2_major THEN
    RETURN 1;
  ELSIF v1_major < v2_major THEN
    RETURN -1;
  ELSIF v1_minor > v2_minor THEN
    RETURN 1;
  ELSIF v1_minor < v2_minor THEN
    RETURN -1;
  ELSE
    RETURN 0;
  END IF;
END;
$$;
