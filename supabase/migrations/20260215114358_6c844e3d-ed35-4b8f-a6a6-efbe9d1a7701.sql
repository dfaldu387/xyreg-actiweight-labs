
-- 1. INSERT policy
DROP POLICY "Users can create user needs for accessible companies" ON user_needs;
CREATE POLICY "Users can create user needs for accessible companies" ON user_needs
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
        AND access_level = ANY(ARRAY['admin','editor','consultant']::user_role_type[])
    )
  );

-- 2. UPDATE policy
DROP POLICY "Users can update user needs for accessible companies" ON user_needs;
CREATE POLICY "Users can update user needs for accessible companies" ON user_needs
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
        AND access_level = ANY(ARRAY['admin','editor','consultant']::user_role_type[])
    )
  );

-- 3. DELETE policy
DROP POLICY "Users can delete user needs for accessible companies" ON user_needs;
CREATE POLICY "Users can delete user needs for accessible companies" ON user_needs
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
        AND access_level = ANY(ARRAY['admin','editor','consultant']::user_role_type[])
    )
  );
