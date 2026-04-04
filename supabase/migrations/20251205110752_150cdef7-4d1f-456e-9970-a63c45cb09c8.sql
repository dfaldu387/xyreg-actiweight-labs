-- Drop partially created tables from failed migration
DROP TABLE IF EXISTS training_records CASCADE;
DROP TABLE IF EXISTS role_training_requirements CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;

-- Training Management System (TMS) Database Schema

-- 1. Training Modules
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('sop', 'video', 'workshop', 'course', 'external')),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  external_url TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'self_paced' CHECK (delivery_method IN ('self_paced', 'live_session', 'blended')),
  requires_signature BOOLEAN DEFAULT true,
  estimated_minutes INTEGER,
  validity_days INTEGER,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Role Training Requirements
CREATE TABLE role_training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  due_type TEXT NOT NULL DEFAULT 'days_after_assignment' CHECK (due_type IN ('days_after_assignment', 'days_after_hire', 'annual', 'one_time')),
  due_days INTEGER DEFAULT 30,
  annual_due_month INTEGER CHECK (annual_due_month >= 1 AND annual_due_month <= 12),
  annual_due_day INTEGER CHECK (annual_due_day >= 1 AND annual_due_day <= 31),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, training_module_id)
);

-- 3. Training Records
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  role_requirement_id UUID REFERENCES role_training_requirements(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'scheduled', 'in_progress', 'completed', 'overdue', 'expired')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at DATE,
  scheduled_session_date TIMESTAMPTZ,
  assigned_trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signature_data JSONB,
  completion_notes TEXT,
  score NUMERIC(5,2),
  previous_record_id UUID REFERENCES training_records(id) ON DELETE SET NULL,
  reissue_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_training_modules_company ON training_modules(company_id);
CREATE INDEX idx_training_modules_active ON training_modules(company_id, is_active);
CREATE INDEX idx_role_training_requirements_role ON role_training_requirements(role_id);
CREATE INDEX idx_role_training_requirements_module ON role_training_requirements(training_module_id);
CREATE INDEX idx_role_training_requirements_company ON role_training_requirements(company_id);
CREATE INDEX idx_training_records_user ON training_records(user_id);
CREATE INDEX idx_training_records_module ON training_records(training_module_id);
CREATE INDEX idx_training_records_company ON training_records(company_id);
CREATE INDEX idx_training_records_status ON training_records(company_id, status);
CREATE INDEX idx_training_records_due ON training_records(user_id, due_date) WHERE status NOT IN ('completed', 'expired');
CREATE INDEX idx_training_records_user_status ON training_records(user_id, status);

-- RLS Policies
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_training_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Training Modules: Company members can view
CREATE POLICY "Company members can view training modules"
  ON training_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = training_modules.company_id
      AND uca.user_id = auth.uid()
    )
  );

-- Training Modules: Admins can manage
CREATE POLICY "Company admins can manage training modules"
  ON training_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = training_modules.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level = 'admin'
    )
  );

-- Role Training Requirements: Company members can view
CREATE POLICY "Company members can view role training requirements"
  ON role_training_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = role_training_requirements.company_id
      AND uca.user_id = auth.uid()
    )
  );

-- Role Training Requirements: Admins can manage
CREATE POLICY "Company admins can manage role training requirements"
  ON role_training_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = role_training_requirements.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level = 'admin'
    )
  );

-- Training Records: Users can view own
CREATE POLICY "Users can view own training records"
  ON training_records FOR SELECT
  USING (user_id = auth.uid());

-- Training Records: Admins can view all in company
CREATE POLICY "Company admins can view all training records"
  ON training_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = training_records.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level IN ('admin', 'editor')
    )
  );

-- Training Records: Users can update own
CREATE POLICY "Users can update own training records"
  ON training_records FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Training Records: Admins can manage all
CREATE POLICY "Company admins can manage all training records"
  ON training_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.company_id = training_records.company_id
      AND uca.user_id = auth.uid()
      AND uca.access_level = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER set_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_role_training_requirements_updated_at
  BEFORE UPDATE ON role_training_requirements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_training_records_updated_at
  BEFORE UPDATE ON training_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();