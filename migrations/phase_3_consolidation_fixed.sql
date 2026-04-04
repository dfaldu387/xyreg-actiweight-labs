
-- Phase 3: Document System Consolidation Migration (Fixed)
-- Step 1: Archive existing data and enhance documents table

-- Archive data only if tables have records
DO $$
BEGIN
  -- Archive phase_assigned_documents if it has data
  IF EXISTS (SELECT 1 FROM phase_assigned_documents LIMIT 1) THEN
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_assigned_documents', 
            (SELECT jsonb_agg(to_jsonb(pad.*)) FROM phase_assigned_documents pad), 
            'phase_3');
  ELSE
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_assigned_documents', '[]'::jsonb, 'phase_3');
  END IF;

  -- Archive phase_documents if it has data
  IF EXISTS (SELECT 1 FROM phase_documents LIMIT 1) THEN
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_documents', 
            (SELECT jsonb_agg(to_jsonb(pd.*)) FROM phase_documents pd), 
            'phase_3');
  ELSE
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_documents', '[]'::jsonb, 'phase_3');
  END IF;

  -- Archive phase_recommended_documents if it has data
  IF EXISTS (SELECT 1 FROM phase_recommended_documents LIMIT 1) THEN
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_recommended_documents', 
            (SELECT jsonb_agg(to_jsonb(prd.*)) FROM phase_recommended_documents prd), 
            'phase_3');
  ELSE
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('phase_recommended_documents', '[]'::jsonb, 'phase_3');
  END IF;

  -- Archive excluded_documents if it has data
  IF EXISTS (SELECT 1 FROM excluded_documents LIMIT 1) THEN
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('excluded_documents', 
            (SELECT jsonb_agg(to_jsonb(ed.*)) FROM excluded_documents ed), 
            'phase_3');
  ELSE
    INSERT INTO archived_pms_data (table_name, archived_data, migration_phase)
    VALUES ('excluded_documents', '[]'::jsonb, 'phase_3');
  END IF;
END $$;

-- Step 2: Add new columns to documents table for consolidation
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tech_applicability_markets jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS classes_by_market jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_excluded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS exclusion_reason text,
ADD COLUMN IF NOT EXISTS source_table text DEFAULT 'documents';

-- Step 3: Migrate data from phase_assigned_documents
INSERT INTO documents (
  name, 
  document_type, 
  status, 
  phase_id, 
  company_id, 
  document_scope, 
  due_date, 
  tech_applicability,
  source_table,
  created_at,
  updated_at
)
SELECT 
  pad.name,
  COALESCE(pad.document_type, 'Standard'),
  COALESCE(pad.status, 'Not Started'),
  pad.phase_id,
  p.company_id,
  'company_template'::document_scope,
  pad.deadline,
  'All device types',
  'phase_assigned_documents',
  COALESCE(pad.created_at, now()),
  COALESCE(pad.updated_at, now())
FROM phase_assigned_documents pad
JOIN phases p ON p.id = pad.phase_id
WHERE NOT EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.name = pad.name 
  AND d.phase_id = pad.phase_id 
  AND d.document_scope = 'company_template'
);

-- Step 4: Migrate data from phase_documents (predefined templates)
INSERT INTO documents (
  name, 
  document_type, 
  phase_id, 
  company_id, 
  document_scope, 
  tech_applicability,
  classes_by_market,
  position,
  is_predefined_core_template,
  source_table,
  status,
  created_at,
  updated_at
)
SELECT 
  pd.name,
  COALESCE(pd.tech_applicability, 'Standard'),
  pd.phase_id,
  p.company_id,
  'company_template'::document_scope,
  COALESCE(pd.tech_applicability, 'All device types'),
  COALESCE(pd.classes_by_market, '{}'),
  COALESCE(pd.position, 0),
  true,
  'phase_documents',
  'Not Started',
  COALESCE(pd.inserted_at, now()),
  COALESCE(pd.updated_at, now())
FROM phase_documents pd
JOIN phases p ON p.id = pd.phase_id
WHERE NOT EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.name = pd.name 
  AND d.phase_id = pd.phase_id 
  AND d.document_scope = 'company_template'
  AND d.is_predefined_core_template = true
);

-- Step 5: Migrate data from phase_recommended_documents
INSERT INTO documents (
  name, 
  description,
  document_type, 
  phase_id, 
  company_id, 
  document_scope, 
  position,
  source_table,
  status,
  created_at,
  updated_at
)
SELECT 
  prd.name,
  prd.description,
  'Recommended',
  prd.phase_id,
  p.company_id,
  'company_template'::document_scope,
  COALESCE(prd.position, 0),
  'phase_recommended_documents',
  'Not Started',
  COALESCE(prd.inserted_at, now()),
  COALESCE(prd.updated_at, now())
FROM phase_recommended_documents prd
JOIN phases p ON p.id = prd.phase_id
WHERE NOT EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.name = prd.name 
  AND d.phase_id = prd.phase_id 
  AND d.document_scope = 'company_template'
);

-- Step 6: Handle excluded documents by updating is_excluded flag
UPDATE documents 
SET is_excluded = true,
    exclusion_reason = 'Excluded by user',
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM excluded_documents ed
  JOIN phases p ON p.id = ed.phase_id
  WHERE documents.name = ed.document_name 
  AND documents.phase_id = ed.phase_id
  AND documents.document_scope = 'company_template'
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_scope_phase ON documents(document_scope, phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_scope ON documents(company_id, document_scope);
CREATE INDEX IF NOT EXISTS idx_documents_excluded ON documents(is_excluded) WHERE is_excluded = true;
CREATE INDEX IF NOT EXISTS idx_documents_position ON documents(phase_id, position) WHERE document_scope = 'company_template';

-- Log completion
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
VALUES (
  'phase_3_completion_log',
  'phase_3',
  '{"phase": "phase_3", "action": "document_consolidation_completed", "timestamp": "' || now()::text || '"}'::jsonb,
  now()
);
