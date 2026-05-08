-- Repair David Health Solutions Oy Foundation SOP registry
-- Company: f3b39a35-4848-4738-ae29-91cfb8d72896
-- Goal: remove polluted/duplicate SOP CI rows so canonical SOP-XX-NNN rows are unique
-- and reseed can top up anything missing.

DO $$
DECLARE
  v_company UUID := 'f3b39a35-4848-4738-ae29-91cfb8d72896';
  v_keep_id UUID;
  v_dup RECORD;
  v_bare RECORD;
BEGIN
  -- 1) For each canonical (company, document_number) group, keep the row whose
  --    name starts with the document_number (canonical "SOP-XX-NNN Title"),
  --    most-recently updated; delete the other duplicates.
  FOR v_dup IN
    SELECT document_number
    FROM public.phase_assigned_document_template
    WHERE company_id = v_company
      AND document_type = 'SOP'
      AND document_number IS NOT NULL
    GROUP BY document_number
    HAVING COUNT(*) > 1
  LOOP
    SELECT id
      INTO v_keep_id
    FROM public.phase_assigned_document_template
    WHERE company_id = v_company
      AND document_type = 'SOP'
      AND document_number = v_dup.document_number
    ORDER BY
      (name ILIKE v_dup.document_number || '%') DESC,
      updated_at DESC
    LIMIT 1;

    DELETE FROM public.phase_assigned_document_template
    WHERE company_id = v_company
      AND document_type = 'SOP'
      AND document_number = v_dup.document_number
      AND id <> v_keep_id;
  END LOOP;

  -- 2) Delete legacy bare-title SOP rows (no document_number) when a canonical
  --    SOP CI for the same title already exists. Match by stripped/lowercased
  --    title equality so "Document Control" collides with "SOP-QA-002 Document Control".
  FOR v_bare IN
    SELECT b.id, b.name
    FROM public.phase_assigned_document_template b
    WHERE b.company_id = v_company
      AND b.document_type = 'SOP'
      AND b.document_number IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.phase_assigned_document_template c
        WHERE c.company_id = v_company
          AND c.document_type = 'SOP'
          AND c.document_number IS NOT NULL
          AND lower(
                regexp_replace(
                  c.name,
                  '^\s*SOP(?:[-_[:space:]]*[A-Za-z]{1,3})?[-_[:space:]]*\d{1,3}[\s\-—:.]*',
                  '',
                  'i'
                )
              ) = lower(b.name)
      )
  LOOP
    DELETE FROM public.phase_assigned_document_template
    WHERE id = v_bare.id;
  END LOOP;

  -- 3) Force document_type = 'SOP' for any remaining row whose name is SOP-prefixed.
  UPDATE public.phase_assigned_document_template
  SET document_type = 'SOP'
  WHERE company_id = v_company
    AND name ~* '^\s*SOP(?:-[A-Za-z]{1,3})?-\d{1,3}'
    AND document_type IS DISTINCT FROM 'SOP';
END $$;