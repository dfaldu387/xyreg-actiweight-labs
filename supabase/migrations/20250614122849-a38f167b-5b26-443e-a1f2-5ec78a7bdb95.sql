
-- CORRECTED: ARCHIVE ALL PHASE-ASSIGNED AND UNASSIGNED COMPANY "TEMPLATES"
-- This script will:
-- 1. Archive current data
-- 2. Clean up foreign key references first
-- 3. Delete templates in the correct order

BEGIN;

-- Step 1: Archive current phase_assigned_documents (company_template scope)
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'phase_assigned_documents_template_cleanup',
  jsonb_agg(to_jsonb(pad.*)),
  'doc_template_cleanup'
FROM phase_assigned_documents pad
WHERE pad.document_scope = 'company_template';

-- Step 2: Archive current company_document_templates
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'company_document_templates_cleanup',
  jsonb_agg(to_jsonb(cdt.*)),
  'doc_template_cleanup'
FROM company_document_templates cdt;

-- Step 3: Archive current documents with scope=company_template
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'documents_template_cleanup',
  jsonb_agg(to_jsonb(d.*)),
  'doc_template_cleanup'
FROM documents d
WHERE d.document_scope = 'company_template';

-- Step 4: Archive documents that reference phase_assigned_documents as template_source_id
INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
SELECT 
  'documents_with_template_refs_cleanup',
  jsonb_agg(to_jsonb(d.*)),
  'doc_template_cleanup'
FROM documents d
WHERE d.template_source_id IN (
  SELECT id FROM phase_assigned_documents WHERE document_scope = 'company_template'
);

-- Step 5: CLEAN UP FOREIGN KEY REFERENCES FIRST
-- Remove template_source_id references to phase_assigned_documents we're about to delete
UPDATE documents 
SET template_source_id = NULL 
WHERE template_source_id IN (
  SELECT id FROM phase_assigned_documents WHERE document_scope = 'company_template'
);

-- Step 6: DELETE documents with scope=company_template
DELETE FROM documents
WHERE document_scope = 'company_template';

-- Step 7: DELETE phase_assigned_documents templates (now safe to delete)
DELETE FROM phase_assigned_documents
WHERE document_scope = 'company_template';

-- Step 8: DELETE company_document_templates
DELETE FROM company_document_templates;

COMMIT;
