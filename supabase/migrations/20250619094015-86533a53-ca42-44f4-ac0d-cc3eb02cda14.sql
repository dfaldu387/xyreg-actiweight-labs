
-- Add version column and enhance version management system

-- Step 1: Add version column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES products(id);

-- Step 2: Add indexes for efficient version queries
CREATE INDEX IF NOT EXISTS idx_products_version ON products(version);
CREATE INDEX IF NOT EXISTS idx_products_parent_product_id ON products(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_products_company_version ON products(company_id, version);

-- Step 3: Enhanced version numbering function
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
  
  -- Parse the version and increment minor version
  major_version := CAST(split_part(latest_version, '.', 1) AS INTEGER);
  minor_version := CAST(split_part(latest_version, '.', 2) AS INTEGER);
  
  -- Increment minor version
  minor_version := minor_version + 1;
  
  -- Return the next version
  next_version := major_version || '.' || minor_version;
  RETURN next_version;
END;
$$;

-- Step 4: Fix the create_project_for_existing_product function
CREATE OR REPLACE FUNCTION create_project_for_existing_product(
  p_project_name text,
  p_project_category text,
  p_project_types text, -- JSON string
  p_company_id uuid,
  p_selected_product_id uuid,
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
  v_project_types_array text[];
BEGIN
  -- Get the selected product details
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
  
  -- Parse project types JSON string to array
  SELECT array_agg(value::text)
  INTO v_project_types_array
  FROM json_array_elements_text(p_project_types::json);
  
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
    is_archived
  ) VALUES (
    v_new_product_name,
    COALESCE(p_description, v_parent_product.description),
    p_company_id,
    v_parent_product.id, -- Set parent to the selected product
    v_next_version,
    'In Development',
    v_parent_product.class,
    v_parent_product.product_market,
    v_project_types_array,
    false,
    false
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
    p_description,
    p_project_category,
    v_project_types_array,
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

-- Step 5: Create version history tracking table
CREATE TABLE IF NOT EXISTS product_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  version_type TEXT DEFAULT 'minor', -- 'major', 'minor', 'patch'
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for version history
CREATE INDEX IF NOT EXISTS idx_product_version_history_product_id ON product_version_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_version_history_parent_product_id ON product_version_history(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_product_version_history_version ON product_version_history(version);

-- Step 6: Create function to get version hierarchy
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

-- Step 7: Create function for version comparison
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

-- Step 8: Create trigger to log version history
CREATE OR REPLACE FUNCTION log_product_version_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log version creation
  INSERT INTO product_version_history (
    product_id,
    parent_product_id,
    version,
    version_type,
    created_by,
    change_description,
    metadata
  ) VALUES (
    NEW.id,
    NEW.parent_product_id,
    COALESCE(NEW.version, '1.0'),
    CASE 
      WHEN NEW.parent_product_id IS NULL THEN 'major'
      ELSE 'minor'
    END,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Product version created'
      ELSE 'Product version updated'
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'old_version', COALESCE(OLD.version, ''),
      'new_version', COALESCE(NEW.version, '1.0')
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS product_version_change_trigger ON products;
CREATE TRIGGER product_version_change_trigger
  AFTER INSERT OR UPDATE OF version ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_version_change();
