-- Enable RLS on gap_analysis_items table
ALTER TABLE gap_analysis_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view gap analysis items for accessible products" ON gap_analysis_items;
DROP POLICY IF EXISTS "Users can create gap analysis items for accessible products" ON gap_analysis_items;
DROP POLICY IF EXISTS "Users can update gap analysis items for accessible products" ON gap_analysis_items;
DROP POLICY IF EXISTS "Users can delete gap analysis items for accessible products" ON gap_analysis_items;

-- Create comprehensive RLS policies for gap_analysis_items
-- Policy for viewing gap analysis items (company-wide and product-specific)
CREATE POLICY "Users can view gap analysis items for accessible companies" ON gap_analysis_items
FOR SELECT
TO authenticated
USING (
  -- For company-wide items (product_id is null), check user has access to any company
  (product_id IS NULL AND EXISTS (
    SELECT 1 FROM user_company_access uca 
    WHERE uca.user_id = auth.uid()
  ))
  OR
  -- For product-specific items, check user has access to the product's company
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_id 
    AND uca.user_id = auth.uid()
  ))
);

-- Policy for creating gap analysis items
CREATE POLICY "Users can create gap analysis items for accessible companies" ON gap_analysis_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- For company-wide items (product_id is null), allow if user has editor/admin access to any company
  (product_id IS NULL AND EXISTS (
    SELECT 1 FROM user_company_access uca 
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
  OR
  -- For product-specific items, check user has editor/admin access to the product's company
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
);

-- Policy for updating gap analysis items
CREATE POLICY "Users can update gap analysis items for accessible companies" ON gap_analysis_items
FOR UPDATE
TO authenticated
USING (
  -- For company-wide items (product_id is null), check user has editor/admin access to any company
  (product_id IS NULL AND EXISTS (
    SELECT 1 FROM user_company_access uca 
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
  OR
  -- For product-specific items, check user has editor/admin access to the product's company
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
)
WITH CHECK (
  -- Same check for the updated row
  (product_id IS NULL AND EXISTS (
    SELECT 1 FROM user_company_access uca 
    WHERE uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
  OR
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level IN ('admin', 'editor')
  ))
);

-- Policy for deleting gap analysis items
CREATE POLICY "Users can delete gap analysis items for accessible companies" ON gap_analysis_items
FOR DELETE
TO authenticated
USING (
  -- For company-wide items (product_id is null), check user has admin access to any company
  (product_id IS NULL AND EXISTS (
    SELECT 1 FROM user_company_access uca 
    WHERE uca.user_id = auth.uid()
    AND uca.access_level = 'admin'
  ))
  OR
  -- For product-specific items, check user has admin access to the product's company
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products p
    JOIN user_company_access uca ON uca.company_id = p.company_id
    WHERE p.id = product_id 
    AND uca.user_id = auth.uid()
    AND uca.access_level = 'admin'
  ))
);