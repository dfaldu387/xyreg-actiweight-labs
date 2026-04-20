-- Enterprise task dependencies table
-- Stores dependency links between enterprise-level tasks (documents, audits, activities)
-- on the company milestones Gantt chart.
--
-- RESTRICTION: Same-type connections only
--   document  → document
--   audit     → audit
--   activity  → activity
--
-- Link types (matches wx-react-gantt):
--   e2s (finish_to_start) — default, most common
--   s2s (start_to_start)
--   e2e (finish_to_finish)
--   s2e (start_to_finish)
--
-- Circular dependency detection is handled client-side via detectCircularDependency()

CREATE TABLE IF NOT EXISTS enterprise_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Source task (predecessor)
  source_task_id TEXT NOT NULL,

  -- Target task (successor)
  target_task_id TEXT NOT NULL,

  -- Task type — both source and target must be the same type
  task_type TEXT NOT NULL CHECK (task_type IN ('document', 'audit', 'activity')),

  -- Link type (matches wx-react-gantt)
  type TEXT NOT NULL DEFAULT 'e2s'
    CHECK (type IN ('e2s', 's2s', 'e2e', 's2e')),

  -- Lag days
  lag_days INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate links
  UNIQUE(company_id, source_task_id, target_task_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ent_deps_company ON enterprise_task_dependencies(company_id);
CREATE INDEX IF NOT EXISTS idx_ent_deps_source ON enterprise_task_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS idx_ent_deps_target ON enterprise_task_dependencies(target_task_id);
CREATE INDEX IF NOT EXISTS idx_ent_deps_type ON enterprise_task_dependencies(task_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ent_task_deps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ent_task_deps_updated_at
  BEFORE UPDATE ON enterprise_task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_ent_task_deps_updated_at();

-- RLS disabled for development
ALTER TABLE enterprise_task_dependencies DISABLE ROW LEVEL SECURITY;
