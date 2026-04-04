-- Drop the incorrect policies
DROP POLICY IF EXISTS "Users can view bundles for their company" ON product_bundles;
DROP POLICY IF EXISTS "Users can create bundles for their company" ON product_bundles;
DROP POLICY IF EXISTS "Users can update bundles for their company" ON product_bundles;
DROP POLICY IF EXISTS "Users can delete bundles for their company" ON product_bundles;

DROP POLICY IF EXISTS "Users can view bundle members for their company" ON product_bundle_members;
DROP POLICY IF EXISTS "Users can create bundle members for their company" ON product_bundle_members;
DROP POLICY IF EXISTS "Users can update bundle members for their company" ON product_bundle_members;
DROP POLICY IF EXISTS "Users can delete bundle members for their company" ON product_bundle_members;

-- Create correct RLS Policies for product_bundles table using user_company_access
CREATE POLICY "Users can view bundles for their company"
ON product_bundles FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create bundles for their company"
ON product_bundles FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update bundles for their company"
ON product_bundles FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete bundles for their company"
ON product_bundles FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM user_company_access 
    WHERE user_id = auth.uid()
  )
);

-- Create correct RLS Policies for product_bundle_members table
CREATE POLICY "Users can view bundle members for their company"
ON product_bundle_members FOR SELECT
USING (
  bundle_id IN (
    SELECT id FROM product_bundles 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create bundle members for their company"
ON product_bundle_members FOR INSERT
WITH CHECK (
  bundle_id IN (
    SELECT id FROM product_bundles 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update bundle members for their company"
ON product_bundle_members FOR UPDATE
USING (
  bundle_id IN (
    SELECT id FROM product_bundles 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete bundle members for their company"
ON product_bundle_members FOR DELETE
USING (
  bundle_id IN (
    SELECT id FROM product_bundles 
    WHERE company_id IN (
      SELECT company_id 
      FROM user_company_access 
      WHERE user_id = auth.uid()
    )
  )
);