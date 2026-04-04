
-- Create projects table to separate projects from products
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  project_category TEXT NOT NULL,
  project_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add parent_product_id and is_line_extension to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_line_extension BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_product_id ON projects(product_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent_product_id ON projects(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_products_parent_product_id ON products(parent_product_id);

-- Function to get existing products for a company (for dropdown)
CREATE OR REPLACE FUNCTION get_company_products_for_selection(target_company_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.inserted_at as created_at
  FROM products p
  WHERE p.company_id = target_company_id
    AND p.is_archived = false
  ORDER BY p.name ASC;
END;
$$;

-- Function to create a project linked to existing product
CREATE OR REPLACE FUNCTION create_project_for_existing_product(
  p_project_name TEXT,
  p_description TEXT,
  p_project_category TEXT,
  p_project_types JSONB,
  p_company_id UUID,
  p_product_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Validate inputs
  IF p_project_name IS NULL OR trim(p_project_name) = '' THEN
    RAISE EXCEPTION 'Project name is required';
  END IF;
  
  IF p_project_category IS NULL OR trim(p_project_category) = '' THEN
    RAISE EXCEPTION 'Project category is required';
  END IF;
  
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID is required';
  END IF;
  
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID is required';
  END IF;
  
  -- Verify product exists and belongs to company
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = p_product_id 
      AND company_id = p_company_id 
      AND is_archived = false
  ) THEN
    RAISE EXCEPTION 'Product not found or not accessible';
  END IF;
  
  -- Create the project
  INSERT INTO projects (
    name,
    description,
    project_category,
    project_types,
    company_id,
    product_id
  ) VALUES (
    trim(p_project_name),
    p_description,
    p_project_category,
    p_project_types,
    p_company_id,
    p_product_id
  )
  RETURNING id INTO v_project_id;
  
  RETURN v_project_id;
END;
$$;

-- Function to create line extension (creates new product + project)
CREATE OR REPLACE FUNCTION create_line_extension_product(
  p_extension_name TEXT,
  p_description TEXT,
  p_project_category TEXT,
  p_project_types JSONB,
  p_company_id UUID,
  p_parent_product_id UUID,
  p_project_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_product_id UUID;
  v_project_id UUID;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_extension_name IS NULL OR trim(p_extension_name) = '' THEN
    RAISE EXCEPTION 'Line extension name is required';
  END IF;
  
  IF p_parent_product_id IS NULL THEN
    RAISE EXCEPTION 'Parent product ID is required';
  END IF;
  
  -- Verify parent product exists and belongs to company
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = p_parent_product_id 
      AND company_id = p_company_id 
      AND is_archived = false
  ) THEN
    RAISE EXCEPTION 'Parent product not found or not accessible';
  END IF;
  
  -- Create the new line extension product
  INSERT INTO products (
    name,
    description,
    company_id,
    parent_product_id,
    is_line_extension,
    project_types,
    status
  ) VALUES (
    trim(p_extension_name),
    p_description,
    p_company_id,
    p_parent_product_id,
    true,
    p_project_types,
    'Concept'
  )
  RETURNING id INTO v_new_product_id;
  
  -- Create associated project
  INSERT INTO projects (
    name,
    description,
    project_category,
    project_types,
    company_id,
    product_id,
    parent_product_id
  ) VALUES (
    COALESCE(p_project_name, p_extension_name || ' Development'),
    p_description,
    p_project_category,
    p_project_types,
    p_company_id,
    v_new_product_id,
    p_parent_product_id
  )
  RETURNING id INTO v_project_id;
  
  -- Return both IDs
  SELECT jsonb_build_object(
    'product_id', v_new_product_id,
    'project_id', v_project_id,
    'success', true
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;
