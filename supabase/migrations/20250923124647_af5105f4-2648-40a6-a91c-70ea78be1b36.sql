-- Delete existing incomplete FDA items and regenerate all 56 items
-- First, delete existing FDA items
DELETE FROM gap_analysis_items 
WHERE framework = 'FDA_21_CFR_820';

-- Now insert all 56 FDA template items as company-wide gap analysis items
INSERT INTO gap_analysis_items (
  framework,
  section,
  requirement,
  category,
  status,
  clause_id,
  clause_summary,
  chapter,
  subsection,
  requirement_summary,
  evidence_method,
  qa_ra_owner,
  rd_owner,
  mfg_ops_owner,
  labeling_owner,
  clinical_owner,
  other_owner,
  product_id  -- This will be NULL for company-wide items
)
SELECT 
  gti.framework,
  gti.section,
  gti.requirement,
  gti.category,
  'not_started',
  gti.clause,
  gti.description,
  gti.chapter,
  gti.subsection,
  gti.requirement_summary,
  gti.evidence_method,
  gti.qa_ra_owner,
  gti.rd_owner,
  gti.mfg_ops_owner,
  gti.labeling_owner,
  gti.clinical_owner,
  gti.other_owner,
  NULL  -- Company-wide items have NULL product_id
FROM gap_template_items gti
WHERE gti.template_id = 'a686bb1a-398c-46af-8b3a-0fdcfa201a8e'  -- FDA template ID
ORDER BY gti.section, gti.requirement;