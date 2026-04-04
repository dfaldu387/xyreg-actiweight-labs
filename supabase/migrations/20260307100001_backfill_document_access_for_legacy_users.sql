-- Backfill document access for legacy users (array-based schema)
--
-- Non-admin users who were created before the document-permission filtering
-- feature have zero rows in user_document_permissions, which means they would
-- see NO documents once the new filtering goes live.
--
-- This migration gives every such user a single row with a document_ids array
-- containing:
--   1) All product-scoped documents for the devices they can access
--   2) All company-scoped documents in their company
--
-- Admin / consultant users are skipped because the application code already
-- bypasses filtering for them.
--
-- Run order:
--   1. 20260306130000 - backfill device access (user_product_matrix)
--   2. 20260307100000 - restructure user_document_permissions to array
--   3. 20260307100001 - THIS FILE - backfill document access

INSERT INTO user_document_permissions (user_id, company_id, document_ids)
SELECT
  sub.user_id,
  sub.company_id,
  array_agg(DISTINCT sub.doc_id) AS document_ids
FROM (
  -- Product-scoped docs from phase_assigned_document_template
  SELECT uca.user_id, uca.company_id, padt.id AS doc_id
  FROM user_company_access uca
  INNER JOIN user_product_matrix upm
    ON  upm.user_id    = uca.user_id
    AND upm.company_id = uca.company_id
    AND upm.is_active  = true
  INNER JOIN phase_assigned_document_template padt
    ON  padt.company_id    = uca.company_id
    AND padt.product_id     = ANY(upm.product_ids)
    AND padt.document_scope = 'product_document'
  WHERE uca.access_level NOT IN ('admin', 'consultant')

  UNION

  -- Product-scoped docs from documents table
  SELECT uca.user_id, uca.company_id, d.id AS doc_id
  FROM user_company_access uca
  INNER JOIN user_product_matrix upm
    ON  upm.user_id    = uca.user_id
    AND upm.company_id = uca.company_id
    AND upm.is_active  = true
  INNER JOIN documents d
    ON  d.company_id    = uca.company_id
    AND d.product_id     = ANY(upm.product_ids)
    AND d.document_scope = 'product_document'
  WHERE uca.access_level NOT IN ('admin', 'consultant')

  UNION

  -- Company-scoped docs
  SELECT uca.user_id, uca.company_id, padt.id AS doc_id
  FROM user_company_access uca
  INNER JOIN phase_assigned_document_template padt
    ON  padt.company_id    = uca.company_id
    AND padt.document_scope = 'company_document'
  WHERE uca.access_level NOT IN ('admin', 'consultant')
) sub
-- Only backfill users who have no existing row
WHERE NOT EXISTS (
  SELECT 1 FROM user_document_permissions udp
  WHERE udp.user_id    = sub.user_id
    AND udp.company_id = sub.company_id
)
GROUP BY sub.user_id, sub.company_id
ON CONFLICT (user_id, company_id) DO NOTHING;
