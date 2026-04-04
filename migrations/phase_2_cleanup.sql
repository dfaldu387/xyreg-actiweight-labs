
-- Phase 2: Remove Empty/Minimally Used Tables
-- This migration removes user_roles, document_tech_types, and dach tables

-- First, archive any existing data from tables before dropping them
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'user_roles',
  'phase_2',
  COALESCE(jsonb_agg(to_jsonb(ur.*)), '[]'::jsonb),
  now()
FROM user_roles ur;

INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'document_tech_types',
  'phase_2', 
  COALESCE(jsonb_agg(to_jsonb(dtt.*)), '[]'::jsonb),
  now()
FROM document_tech_types dtt;

INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
SELECT 
  'dach',
  'phase_2',
  COALESCE(jsonb_agg(to_jsonb(d.*)), '[]'::jsonb),
  now()
FROM dach d;

-- Drop the tables (CASCADE to handle any potential dependencies)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS document_tech_types CASCADE;
DROP TABLE IF EXISTS dach CASCADE;

-- Log completion
INSERT INTO archived_pms_data (table_name, migration_phase, archived_data, archived_at)
VALUES (
  'phase_2_completion_log',
  'phase_2',
  '{"phase": "phase_2", "action": "completed", "tables_removed": ["user_roles", "document_tech_types", "dach"], "timestamp": "' || now()::text || '"}'::jsonb,
  now()
);
