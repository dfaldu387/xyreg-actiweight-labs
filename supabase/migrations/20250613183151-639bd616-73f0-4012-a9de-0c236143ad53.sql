
-- Phase 3: Document System Restructuring & Proper Scope Separation (Fixed)
-- This migration fixes existing data before applying constraints

BEGIN;

-- Step 1: Archive existing data for safety (only if not already done)
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'phase_assigned_documents_phase3',
  jsonb_agg(to_jsonb(pad.*)),
  'phase_3'
FROM phase_assigned_documents pad
WHERE NOT EXISTS (
  SELECT 1 FROM archived_pms_data 
  WHERE table_name = 'phase_assigned_documents_phase3' 
  AND migration_phase = 'phase_3'
);

-- Step 2: Fix existing documents that violate constraints
-- Fix company_template documents that should have phase_id
UPDATE documents 
SET phase_id = (
  SELECT p.id 
  FROM phases p 
  WHERE p.company_id = documents.company_id 
  LIMIT 1
)
WHERE document_scope = 'company_template' 
  AND phase_id IS NULL 
  AND company_id IS NOT NULL;

-- Fix company_document records to ensure they have no phase_id
UPDATE documents 
SET phase_id = NULL 
WHERE document_scope = 'company_document' AND phase_id IS NOT NULL;

-- Fix product_document records to ensure they have product_id
UPDATE documents 
SET product_id = (
  SELECT id FROM products 
  WHERE company_id = documents.company_id 
  LIMIT 1
)
WHERE document_scope = 'product_document' 
  AND product_id IS NULL 
  AND company_id IS NOT NULL;

-- Step 3: Remove any documents that still can't be fixed
DELETE FROM documents 
WHERE (
  (document_scope = 'company_template' AND (phase_id IS NULL OR company_id IS NULL)) OR
  (document_scope = 'company_document' AND company_id IS NULL) OR
  (document_scope = 'product_document' AND product_id IS NULL)
);

-- Step 4: Migrate company_template documents from phase_assigned_documents to documents table
INSERT INTO documents (
  id,
  name,
  document_type,
  document_scope,
  phase_id,
  company_id,
  status,
  tech_applicability,
  created_at,
  updated_at
)
SELECT 
  pad.id,
  pad.name,
  pad.document_type,
  'company_template'::document_scope,
  pad.phase_id,
  p.company_id,
  pad.status,
  pad.tech_applicability,
  COALESCE(pad.created_at, now()),
  COALESCE(pad.updated_at, now())
FROM phase_assigned_documents pad
JOIN phases p ON p.id = pad.phase_id
WHERE pad.document_scope = 'company_template'
ON CONFLICT (id) DO UPDATE SET
  phase_id = EXCLUDED.phase_id,
  company_id = EXCLUDED.company_id,
  status = EXCLUDED.status,
  tech_applicability = EXCLUDED.tech_applicability,
  updated_at = now();

-- Step 5: Add proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_documents_scope_company ON documents(document_scope, company_id) WHERE document_scope IN ('company_template', 'company_document');
CREATE INDEX IF NOT EXISTS idx_documents_scope_product ON documents(document_scope, product_id) WHERE document_scope = 'product_document';
CREATE INDEX IF NOT EXISTS idx_documents_phase_company ON documents(phase_id, company_id) WHERE phase_id IS NOT NULL;

-- Step 6: Now add constraints to ensure data integrity
ALTER TABLE documents ADD CONSTRAINT chk_company_template_has_phase 
  CHECK (
    (document_scope = 'company_template' AND phase_id IS NOT NULL AND company_id IS NOT NULL) OR
    (document_scope = 'company_document' AND phase_id IS NULL AND company_id IS NOT NULL) OR
    (document_scope = 'product_document' AND product_id IS NOT NULL) OR
    document_scope IS NULL
  );

-- Step 7: Create a view for easy querying of company templates by phase
CREATE OR REPLACE VIEW company_template_documents_by_phase AS
SELECT 
  d.*,
  p.name as phase_name,
  p.position as phase_position
FROM documents d
JOIN phases p ON p.id = d.phase_id
WHERE d.document_scope = 'company_template'
ORDER BY p.position, d.name;

-- Step 8: Create a function to get documents by scope and context
CREATE OR REPLACE FUNCTION get_documents_by_scope(
  p_scope document_scope,
  p_company_id uuid DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_phase_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  document_type text,
  status text,
  tech_applicability text,
  phase_id uuid,
  phase_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.document_type,
    d.status,
    d.tech_applicability,
    d.phase_id,
    p.name as phase_name,
    d.created_at,
    d.updated_at
  FROM documents d
  LEFT JOIN phases p ON p.id = d.phase_id
  WHERE d.document_scope = p_scope
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND (p_product_id IS NULL OR d.product_id = p_product_id)
    AND (p_phase_id IS NULL OR d.phase_id = p_phase_id)
  ORDER BY 
    CASE 
      WHEN p_scope = 'company_template' THEN p.position
      ELSE 0
    END,
    d.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
