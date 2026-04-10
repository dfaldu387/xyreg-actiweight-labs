
-- Fix: Allow Core documents (phase_id IS NULL) to be accessible via RLS

DROP POLICY IF EXISTS "Users can manage phase templates for accessible companies" ON phase_assigned_document_template;
DROP POLICY IF EXISTS "Users can view phase templates for accessible companies" ON phase_assigned_document_template;

CREATE POLICY "Users can manage phase templates for accessible companies"
ON phase_assigned_document_template
FOR ALL
TO authenticated
USING (
  phase_id IN (
    SELECT cp.id FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  )
  OR (
    phase_id IS NULL AND company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  )
)
WITH CHECK (
  phase_id IN (
    SELECT cp.id FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  )
  OR (
    phase_id IS NULL AND company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
    )
  )
);

CREATE POLICY "Users can view phase templates for accessible companies"
ON phase_assigned_document_template
FOR SELECT
TO authenticated
USING (
  phase_id IN (
    SELECT cp.id FROM company_phases cp
    WHERE cp.company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  )
  OR (
    phase_id IS NULL AND company_id IN (
      SELECT company_id FROM user_company_access
      WHERE user_id = auth.uid()
    )
  )
);
