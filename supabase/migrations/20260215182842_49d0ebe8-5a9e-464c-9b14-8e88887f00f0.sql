-- Update hazard INSERT policy to include consultant role
DROP POLICY "Users can create hazards for their companies" ON hazards;
CREATE POLICY "Users can create hazards for their companies" ON hazards
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update hazard UPDATE policy to include consultant role
DROP POLICY "Users can update hazards for their companies" ON hazards;
CREATE POLICY "Users can update hazards for their companies" ON hazards
FOR UPDATE USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Update hazard DELETE policy to include consultant role
DROP POLICY "Users can delete hazards for their companies" ON hazards;
CREATE POLICY "Users can delete hazards for their companies" ON hazards
FOR DELETE USING (
  company_id IN (
    SELECT user_company_access.company_id
    FROM user_company_access
    WHERE user_company_access.user_id = auth.uid()
      AND user_company_access.access_level = ANY (ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);