-- Scope: David Health Solutions Oy
DO $$
DECLARE
  v_company uuid := 'f3b39a35-4848-4738-ae29-91cfb8d72896';
BEGIN
  -- 1. Delete rows whose title is wrong for the SOP number, or malformed numbering
  DELETE FROM document_studio_templates
  WHERE company_id = v_company
    AND (
      name = 'SOP-006 Training and Competence'         -- belongs to SOP-004
      OR name = 'SOP-006 Design and Development'        -- generic wrong title
      OR name = 'SOP-007 Risk Management'               -- belongs to SOP-015
      OR name = 'SOP-008 Design and Development'        -- wrong title
      OR name = 'SOP-011 Control of Nonconforming Product' -- belongs to SOP-032
      OR name = 'SOP-014 Post-Market Surveillance (PMS)' -- belongs to SOP-022
      OR name = 'SOP-026 Biocompatibility Evaluation'   -- SOP-026 is Usability Eng
      OR name = 'SOP-036 Technical Documentation Management' -- SOP-036 is Classification
      OR name = 'SOP-0063 Design Inputs'                -- malformed number
      OR name = 'SOP-0083 Design Outputs'               -- malformed number
    );

  -- 2. Strip baked-in sub-prefixes from stored names (display layer adds them back)
  UPDATE document_studio_templates
  SET name = regexp_replace(name, '^SOP-[A-Z]{2}-(\d{3})', 'SOP-\1')
  WHERE company_id = v_company
    AND name ~ '^SOP-[A-Z]{2}-\d{3}';

  -- 3. De-duplicate: keep the most recently updated row per (company, name)
  DELETE FROM document_studio_templates a
  USING document_studio_templates b
  WHERE a.company_id = v_company
    AND b.company_id = v_company
    AND a.name = b.name
    AND a.id <> b.id
    AND (a.updated_at, a.id) < (b.updated_at, b.id);

  -- 4. Normalize type to 'SOP' for all SOP rows
  UPDATE document_studio_templates
  SET type = 'SOP'
  WHERE company_id = v_company
    AND name ~* '^SOP-\d{3}'
    AND type <> 'SOP';
END $$;