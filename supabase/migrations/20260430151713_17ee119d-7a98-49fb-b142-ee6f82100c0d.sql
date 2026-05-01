-- Clean up orphan translated drafts whose content row was never written due to the prior NOT NULL bug.
-- Identifies translation-derived CIs with no corresponding studio row and removes them, then
-- clears the pointer in the parent's language_variants map.

WITH orphans AS (
  SELECT pat.id AS ci_id, pat.derived_from_ci_id AS parent_id, pat.language AS lang
  FROM phase_assigned_document_template pat
  WHERE pat.derivation_type = 'translation'
    AND NOT EXISTS (
      SELECT 1 FROM document_studio_templates dst
      WHERE dst.template_id = pat.id::text
    )
),
parents_to_fix AS (
  SELECT DISTINCT parent_id, lang FROM orphans WHERE parent_id IS NOT NULL
)
UPDATE phase_assigned_document_template parent
SET language_variants = COALESCE(parent.language_variants, '{}'::jsonb) - ptf.lang
FROM parents_to_fix ptf
WHERE parent.id = ptf.parent_id;

DELETE FROM phase_assigned_document_template pat
WHERE pat.derivation_type = 'translation'
  AND NOT EXISTS (
    SELECT 1 FROM document_studio_templates dst
    WHERE dst.template_id = pat.id::text
  );
